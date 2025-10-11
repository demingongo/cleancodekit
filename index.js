#! /usr/bin/env node

/**
 * @author demingongo
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { exec as cp_exec } from 'node:child_process'
import mri from 'mri'
import * as prompts from '@clack/prompts'
import colors from 'picocolors'
import { applyEdits, findNodeAtLocation, modify, parseTree } from 'jsonc-parser'

const argv = mri(process.argv.slice(2), {
    alias: { h: 'help', p: 'parser', m: 'mocha' },
    boolean: ['help', 'mocha'],
    string: ['parser'],
})
const cwd = process.cwd()

//#region dependencies

const DEV_DEPENDENCIES = [
    '@dotenvx/dotenvx',
    '@eslint/eslintrc',
    '@eslint/js',
    '@stylistic/eslint-plugin',
    '@trivago/prettier-plugin-sort-imports',
    '@types/node',
    'eslint',
    'eslint-config-prettier',
    'eslint-plugin-import',
    'globals',
    'husky',
    'lint-staged',
    'prettier'
]

//#endregion dependencies

//#region parser dependencies

const PARSERS = [
    {
        name: 'babel',
        display: 'Babel',
        emoji: '🌀',
        color: colors.yellow,
        dependencies: [
            '@babel/cli',
            '@babel/core',
            '@babel/eslint-parser',
            '@babel/preset-env'
        ],
        src: 'src',
        extensions: [
            'mjs',
            'js'
        ]
    },
    {
        name: 'es8',
        display: 'ECMAScript 2017',
        emoji: '📜',
        color: colors.blue,
        dependencies: [],
        src: '',
        extensions: [
            'mjs',
            'js'
        ]
    },
    {
        name: 'typescript',
        display: 'Typescript',
        emoji: '🛡️ ',
        color: colors.cyan,
        dependencies: [
            '@typescript-eslint/eslint-plugin',
            '@typescript-eslint/parser',
            'eslint-import-resolver-typescript',
            'ts-node',
            'typescript-eslint'
        ],
        src: 'src',
        extensions: [
            'mts',
            'ts'
        ]
    },
    {
        name: 'commonjs',
        display: 'CommonJS',
        emoji: '📦',
        color: colors.red,
        dependencies: [],
        src: '',
        extensions: [
            'cjs',
            'js'
        ]
    }
]

//#endregion parser dependencies

//#region mocha dependencies

const MOCHA_DEPENDENCIES = [
    '@types/chai',
    '@types/mocha',
    'chai',
    'eslint-plugin-mocha',
    'mocha'
]

//#endregion mocha dependencies

//#region helper message

// prettier-ignore
const helpMessage = `\
  Usage: cleancodekit [OPTION]...
  
  Options:
    -m, --mocha                install dependencies for Mocha test framework
    -p, --parser NAME          use a specific parser


  Available parsers:
    ${PARSERS[0].color(PARSERS[0].name)}
    ${PARSERS[1].color(PARSERS[1].name)}
    ${PARSERS[2].color(PARSERS[2].name)}`

//#endregion helper message

//#region init

async function init() {
    const argParser = argv.template
    const argMocha = argv.mocha
    const isEmojiSupported = supportsEmoji()

    const help = argv.help
    if (help) {
        console.log(helpMessage)
        return
    }

    const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
    const cancel = () => prompts.cancel('Operation cancelled')

    // 1. Choose a parser
    let parserObject = PARSERS.find(p => p.name == argParser)
    let hasInvalidArgParser = false
    if (argParser && !PARSERS.map(p => p.name).includes(argParser)) {
        hasInvalidArgParser = true
    }

    if (!parserObject) {
        parserObject = await prompts.select({
            message: hasInvalidArgParser
                ? `"${argTemplate}" isn't a valid parser. Please choose from below: `
                : 'Select a parser:',
            options: PARSERS.map((p) => {
                const parserColor = p.color
                return {
                    label: (isEmojiSupported ? `${p.emoji}  ` : '') + parserColor(p.display || p.name),
                    value: p,
                }
            }),
        })
        if (prompts.isCancel(parserObject)) return cancel()
    }

    const projectRoot = path.join(cwd)
    const pkgManager = pkgInfo ? pkgInfo.name : 'npm'
    const templatesDir = path.resolve(
        fileURLToPath(import.meta.url),
        '..',
        'templates'
    )

    prompts.log.step(`Scaffolding project in ${projectRoot}...`)

    // 2. Install dependencies
    let addPkgsCommand = ''
    switch (pkgManager) {
        case 'yarn':
        case 'pnpm':
            addPkgsCommand = `${pkgManager} add -D`
            break
        default:
            addPkgsCommand += `${pkgManager} i -D`
            break
    }

    let devInstallCommand = `${addPkgsCommand} ${DEV_DEPENDENCIES.join(' ')}`

    if (parserObject.dependencies.length) {
        devInstallCommand += ` ${parserObject.dependencies.join(' ')}`
    }

    if (argMocha) {
        devInstallCommand += ` ${MOCHA_DEPENDENCIES.join(' ')}`
    }

    const error = await executeCommand(devInstallCommand)
    if (error) {
        throw error
    }

    // 3. Edit package.json (scripts)
    const pkgJsonContent = fs.readFileSync(path.resolve(
        projectRoot,
        'package.json'
    ), 'utf8')
    let updatedPkgJsonContent = editJsonContent(
        pkgJsonContent,
        ['scripts', 'format'],
        'dotenvx run -f .env.format -- lint-staged'
    );
    updatedPkgJsonContent = editJsonContent(
        updatedPkgJsonContent,
        ['scripts', 'format:check'],
        `dotenvx run -f .env.format -- prettier --check ./${parserObject.src}`
    );
    updatedPkgJsonContent = editJsonContent(
        updatedPkgJsonContent,
        ['scripts', 'format:write'],
        `dotenvx run -f .env.format -- prettier --write ./${parserObject.src}`
    );
    updatedPkgJsonContent = editJsonContent(
        updatedPkgJsonContent,
        ['scripts', 'lint'],
        'eslint .'
    );
    fs.writeFileSync(path.resolve(
        projectRoot,
        'package.json'
    ), updatedPkgJsonContent, 'utf8');

    // vscode settings
    try {
        await setUpVSCode(
            templatesDir,
            projectRoot
        );
    } catch (_err) {
        //
    }

    // eslint settings
    await setUpESLint(
        templatesDir,
        projectRoot,
        parserObject.name
    );

    // prettier settings
    await setUpPrettier(
        templatesDir,
        projectRoot
    );

    // lint-staged settings
    await setUpLintStaged(
        templatesDir,
        projectRoot,
        parserObject.src,
        parserObject.extensions
    );

    // husky settings
    try {
        await setUpHusky(
            templatesDir,
            projectRoot
        );
    } catch (_err) {
        //
    }

    prompts.outro('Done.')
}

//#endregion init

//#region setup

/**
 * 
 * @param {string} templatesDir 
 * @param {string} projectRoot 
 */
async function setUpVSCode(
    templatesDir,
    projectRoot
) {
    if (!fs.existsSync(path.resolve(
        projectRoot,
        '.vscode'
    ))) {
        fs.cpSync(path.resolve(
            templatesDir,
            '.vscode',
            'settings.json'
        ), path.resolve(
            projectRoot,
            '.vscode',
            'settings.json'
        ), { recursive: true })
    } else {
        const templateSettings = await import(pathToFileURL(path.resolve(
            templatesDir,
            '.vscode',
            'settings.json'
        )), { with: { type: "json" } })
        const settings = await import(pathToFileURL(path.resolve(
            projectRoot,
            '.vscode',
            'settings.json'
        )), { with: { type: "json" } })
        const result = { ...templateSettings.default, ...settings.default }

        fs.writeFileSync(path.join(
            projectRoot,
            '.vscode',
            'settings.json'
        ), JSON.stringify(result, null, '    '), 'utf8');
    }
}

/**
 * 
 * @param {string} templatesDir 
 * @param {string} projectRoot 
 * @param {string} parserName 
 */
async function setUpESLint(
    templatesDir,
    projectRoot,
    parserName
) {
    fs.cpSync(path.resolve(
        templatesDir,
        `eslint.config.${parserName}.mjs`
    ), path.resolve(
        projectRoot,
        'eslint.config.mjs'
    ), { recursive: true })
}

/**
 * 
 * @param {string} templatesDir
 * @param {string} projectRoot
 */
async function setUpPrettier(
    templatesDir,
    projectRoot
) {
    fs.cpSync(path.resolve(
        templatesDir,
        'prettier.config.mts'
    ), path.resolve(
        projectRoot,
        'prettier.config.mts'
    ), { recursive: true });
    fs.cpSync(path.resolve(
        templatesDir,
        '.prettierignore'
    ), path.resolve(
        projectRoot,
        '.prettierignore'
    ), { recursive: true });
    fs.cpSync(path.resolve(
        templatesDir,
        '.env.format'
    ), path.resolve(
        projectRoot,
        '.env.format'
    ), { recursive: true });
}

/**
 * 
 * @param {string} templatesDir 
 * @param {string} projectRoot 
 * @param {string} parserSrc 
 * @param {string[]} parserExtensions 
 */
async function setUpLintStaged(
    templatesDir,
    projectRoot,
    parserSrc,
    parserExtensions
) {
    if (!fs.existsSync(path.resolve(
        projectRoot,
        'lint-staged.config.mts'
    ))) {
        // read template file, update content, create file
        const lintStagedContent = fs.readFileSync(path.resolve(
            templatesDir,
            'lint-staged.config.mts'
        ), 'utf8')

        const extensions = parserExtensions.join(',')
        const updatedLintStagedContent = lintStagedContent
            .replace(/<src>/, parserSrc ? `${parserSrc}/` : '')
            .replace(/<extensions>/, parserExtensions.length > 1 ? `{${extensions}}` : extensions);

        fs.writeFileSync(path.resolve(
            projectRoot,
            'lint-staged.config.mts'
        ), updatedLintStagedContent, 'utf8');
    }
}

/**
 * 
 * @param {string} templatesDir
 * @param {string} projectRoot
 */
async function setUpHusky(
    templatesDir,
    projectRoot
) {
    fs.cpSync(path.resolve(
        templatesDir,
        '.husky'
    ), path.resolve(
        projectRoot,
        '.husky'
    ), { recursive: true })
}

//#endregion setup

//#region utils

/**
 * 
 * @param {string} content 
 * @param {JSONPath} key 
 * @param {any} value 
 * @param {boolean} overwrite 
 * @returns {string}
 */
function editJsonContent(content, key, value, overwrite) {
    const tree = parseTree(content);

    // Check if already exists
    const lintNode = overwrite ? false : findNodeAtLocation(tree, key);

    if (!lintNode) {
        const edits = modify(content, key, value, {
            formattingOptions: { insertSpaces: true, tabSize: 2 }
        });
        return applyEdits(content, edits);
    } else {
        return content
    }
}


/**
 * 
 * @param {string} str the command
 * @returns 
 */
function executeCommand(str) {
    return new Promise((res) => {
        cp_exec(str, (err) => {
            res(err)
        })
    })
}

/**
 * 
 * @param {string} [userAgent] 
 * @returns 
 */
function pkgFromUserAgent(userAgent) {
    if (!userAgent) return undefined
    const pkgSpec = userAgent.split(' ')[0]
    const pkgSpecArr = pkgSpec.split('/')
    return {
        name: pkgSpecArr[0],
        version: pkgSpecArr[1],
    }
}

function supportsEmoji() {
    const isWindows = process.platform === 'win32';
    const isCI = !!process.env.CI;
    const term = process.env.TERM || '';
    const colorterm = process.env.COLORTERM || '';

    return (
        !isCI &&
        (process.stdout.isTTY || process.env.FORCE_COLOR) &&
        (term.includes('xterm') || colorterm.includes('truecolor') || !isWindows)
    );
}


//#endregion utils

//#region start init

init().catch((e) => {
    console.error(e)
})

//#endregion start init