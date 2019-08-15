#!/usr/bin/env node

const puppeteer = require('puppeteer')
const devices = require('puppeteer/DeviceDescriptors')
const fs = require('fs')
const childProcess = require('child_process')
const path = require('path')
const readline = require('readline')
const yargs = require('yargs')
const chalk = require('chalk')

const regcli = './node_modules/reg-cli/dist/cli.js'

const devicesToEmulate = [
	// { name: 'SM', profile: devices['iPhone 5'] },
	// { name: 'MD', profile: devices['iPad Mini'] },
	// { name: 'LG', profile: devices['iPad Mini landscape'] },
	{ name: 'XL', profile: {
			'name': 'notebook',
			'userAgent': 'Mozilla/5.0 (PlayBook; U; RIM Tablet OS 2.1.0; en-US) AppleWebKit/536.2+ (KHTML like Gecko) Version/7.2.1.0 Safari/536.2+',
			'viewport': {
				'width': 1200,
				'height': 800,
				'deviceScaleFactor': 1,
				'isMobile': false,
				'hasTouch': false,
				'isLandscape': true
			}
		}
	}
]

let headless = true

const capture = (sourcefile, output) => {
	if (!fs.existsSync(output)) {
		console.error(chalk.red('Error: The specified output directory does not exist'))
		process.exit(1)
	}
	const source = fs.createReadStream(sourcefile).on('error', () => {
		console.log(chalk.red('Error: The specified source file does not exist or is unreadable'))
		process.exit(1)
	})

	let urls = []
	readline.createInterface({input: source})
	.setMaxListeners(1000)
	.on('line', (url) => {
		if (url != '') {
			urls.push(url)
		}
	})
	.on('close', () => {
		let timeOut = 0
		urls.forEach((url, i) => {
			setTimeout(function () {
				const progressString = chalk.yellow(`${i+1} of ${urls.length}`)
				console.log(`\ncapturing ${progressString} \n  url:       ${url} \n  to folder: ${output}`)
				const urlParts = url.split('/')
				screenName = urlParts[urlParts.length - 1]
				if (screenName === '') {
					screenName = urlParts[urlParts.length - 2]
				}
				captureScreen(screenName, url, devicesToEmulate, output )
					.catch( (e) => { console.log(chalk.red(e)) } )
			}, timeOut)
			timeOut = timeOut + 5000
		})
	})

}

const captureScreen = async (screenName, screenUrl, devicesToEmulate, destination) => {
	const browser = await puppeteer.launch({ 
		headless,
		ignoreHTTPSErrors: true,
		args: ['--start-maximized'] 
	});
	const page = await browser.newPage()

	// capture a screenshot of each device we wish to emulate (`devicesToEmulate`)
	for (let device of devicesToEmulate) {
		await page.emulate(device.profile)
		await page.goto(screenUrl)
		const fileName = screenName + '@' + device.name + '.png'
		const scr = await page.screenshot({path: destination + '/' + fileName, fullPage: true})
	}
	await browser.close()
	console.log(chalk.green('FINISHED ' + screenName))
}

module.exports = yargs
	.command('setup', 'Create test directory with sample URL lists', {}, 
	function () {
		fs.mkdirSync(__dirname + '/tests/current', { recursive: true }, (err) => {
			if (err) throw err;
		});
		fs.mkdirSync(__dirname + '/tests/reference', { recursive: true }, (err) => {
			if (err) throw err;
		});
		fs.mkdirSync(__dirname + '/tests/diff', { recursive: true }, (err) => {
			if (err) throw err;
		});
		fs.openSync(__dirname + '/tests/current.txt', 'a')
		fs.openSync(__dirname + '/tests/reference.txt', 'a')
	})
	.command('capture', 'Captures screenshots of supplied URLs', {
		file: {
			description: 'Textfile with line-separated URLs',
			alias: 'f',
			type: 'string',
			demandOption: true
		},
		output: {
			description: 'Where to save the screenshots',
			alias: 'o',
			type: 'string',
			demandOption: true
		},
		display: {
			description: 'Turns off headless mode',
			alias: 'd',
			type: 'boolean'
		}
	}, function (argv) {
		if (argv.display) headless = false
		capture(path.resolve(argv.file), path.resolve(argv.output))
	})
	.command('diff', 'Makes diff of screenshots in provided folders', {
		reference: {
			description: 'Reference screenshots folder',
			alias: 'r',
			type: 'string',
			demandOption: true
		},
		new: {
			description: 'Current screenshots folder',
			alias: 'n',
			type: 'string',
			demandOption: true
		},
		diff: {
			description: 'Diff output folder',
			alias: 'd',
			type: 'string',
			demandOption: true
		},
		report: {
			description: 'Where to save the HTML report',
			type: 'string',
			default: __dirname + '/report.html'
		}
	}, function (argv) {
		childProcess.fork(regcli, [argv.new, argv.reference, argv.diff, '-R', argv.report, '-M', '0.2'])
	})
	.help()
	.alias('help', 'h')
	.argv
