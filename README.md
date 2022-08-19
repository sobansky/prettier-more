# Prettier More
Code formatter for Visual Studio Code using prettier-m.

_This is a fork of prettier for VS Code. It is using prettier-m plugin and it gives more formatting options._

### Supported languages:
_Javascript, TypeScript, HTML, CSS, SCSS, JSON, YAML and more_

## Installation

It is possible to install it via VS Code extensions. Search for `Prettier More - Code formatter`. 

Then you can open the JSON settings and add following lines:
```json
{
    "editor.defaultFormatter": "marbos.prettier-more",
    "editor.formatOnSave": true
}
 ```
## Formatting options

### New formatting options
<!-- * **alignObjectProperties** (_default **true**_) : align colons in multiline object literals, except JSON

* **offsetTernaryExpressions** (_default **true**_) :  indent and align ternary expression branches -->
* **arrayBracketSpacing** (_defualt **false**_) : add spaces between array 
brackets 

* **breakBeforeElse** (_default **false**_) : add a line break before the <b>else</b> statement

* **breakLongMethodChains** (_default **true**_) : break method chains with more than 3 method calls

* **indentChains** (_default **false**_) : disable indents at the start of chained calls
### Origin options
* **printWidth** (_default **120**_) : number of characters per line limit

* **tabWidth** (_default **2**_) : number of spaces per Tab 
* **useTabs** (_default **true**_) : indent by tabs instead of spaces 
* **singleQuote** (_default **true**_) : will use single quote instead of double one 
* **jsxSingleQuote** (_default **false**_) : settings applied for JSX files
* **trailingComma** (_default **"es5"**_) : 
* **semi** (_default **true**_) : it add a semicolon to the end of every statement
* **quoteProps** (_default **"as-needed"**_) : change when properties in objects are quoted
* **bracketSpacing** (_default **true**_) : add spaces between brackets in object literals
* **bracketSameLine** (_default **false**_) : put ending bracket '>' in the HTML to the same line as the last attribute is.
* **arrowParens** (_default **"always"**_) : add parentheses to arrow function ```(x) => x...```
* **rangeStart** (_default **0**_) : position in file from formatting will start
* **rangeEnd** (_default **Infinity**_) : number of characters from start position to formatting
* **parser** (_default **None**_) : specify which parser will be used
* **filePath** (_default **None**_) : specify file name to infer parser to use
* **requirePragma** (_default **false**_) : restricts to format only files containing special comment 
```
/**
* @prettier or @format
*/
```
* **insertPragma** (_default **false**_) : if some file is formatted with prettier, it can insert pragma at the top of the file
* **proseWrap** (_default **"preserve"**_) : if always, it can wrap also markdown files and similar

* **htmlWhitespaceSensitivity** (_default **"css"**_) : whitespace sensitivity for HTML, Angular, Vue and Handlebars

* **vueIndentScriptAndStyle** (_default **false**_) : sets indent the code inside of ```<script>``` and ```<style>```
* **endOfLine** (_default **"lf"**_) : sets which endinig of line will be used in code editor
* **embeddedLanguageFormatting** (_default **"auto"**_) : sets if will be formatted quoted code in the file
* **singleAttributePerLine** (_default **false**) : enforce single attribute per line in HTML, Vue and JSX.