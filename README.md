# Visual regression tests tool
Visual regression tests tool based on Puppeteer & reg-cli.
Use it to spot changes between two sets of URLs, e.g. production vs test URLs.

First provide a list of URLs as a line-separated text file, then run "capture" on each set to batch capture the screenshots into separate directories. Finally, run a diff between the two directories. This will also generate an HTML report overviewing the changes.

## Install dependencies

``` bash
$ npm install
```

## Setup test directory and files

``` bash
$ npm run setup
```

## Capture screenshots

``` bash
$ npm run capture-ref
$ npm run capture-new
```

## Make diff

``` bash
$ npm run diff
```

Images will be placed in "diff" folder

Report will be generated as report.html