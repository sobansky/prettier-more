# Prettier More
Code formatter for Visual Studio Code using prettierx.

_This is a fork of prettier for VS Code. It is using prettierx plugin and gives more formating options._

### Supported languages:
_Javascript, TypeScript, HTML, CSS, SCSS, JSON, YAML and more_

## Installation
#
It is possible to install it via VS Code extensions. Search for `Prettier More - Code formatter`. 

Then you can open the JSON settings and add following lines:
```json
{
    "editor.defaultFormatter": "marbos.prettier-more-vscode",
    "editor.formatOnSave": true
}
 ```
## Formatting options
#
### New formatting options
* **alignObjectProperties** (_default **true**_) : align colons in multiline object literals, except JSON

* **offsetTernaryExpressions** (_default **true**_) :  indent and align ternary expression branches

* **spaceBeforeFunctionParen** (_default **true**_) : add a space before function parenthesis in all declarations

* **generatorStarSpacing** (_default **true**_) : add spaces around the star ```(*)``` in generator functions

* **yieldStarSpacing** (_default **true**_) : put spaces around the star ```(*)``` in yield* expressions 

* **indentChains** (_default **false**_) : disable indents at the start of chained calls

* **breakBeforeElse** (_default **true**_) : add a line break before else
* **importFormatting** (_default **"online"**_) : formatting of import statements. If "online" is set, will be used VS Code formatting option
* **htmlVoidTags** (_default **true**_) : format void HTML elements as void tags
* **breakLongMethodChains** (_default **true**_) : break method chains with more than 3 method calls
* **arrayBracketSpacing** (_defualt **true**_) : add spaces between array 
brackets 
* **cssParenSpacing** (_default **true**_) : add spaces between parens in CSS
* **computedPropertySpacing** (_default **true**_) : add paces between computed property brackets
* **spaceInParens** (_default **true**_) : print spaces in between parens
* **spaceUnaryOps** (_default **true**_) : add spaces after unary operator symbols, except in the middle of ```!!```
* **templateCurlySpacing** (_default **true**_) : add spaces between template curly brackets
* **typeAngleBracketSpacing** (_default **false**_) : add spaces between type angle brackets.
* **typeBracketSpacing** (_default **false**_) : add spaces between type brackets
* **exportCurlySpacing** (_default **false**_) : add spaces between export curly braces
* **importCurlySpacing** (_default **false**_) : add spaces between import curly braces
* **objectCurlySpacing** (_default **false**_) : add spaces between object curly braces
* **graphqlCurlySpacing** (_default **false**_) : add spaces between curly braces for GraphQL
* **yamlBracketSpacing** (_default **false**_) : add spaces between brackets/curly braces for YAML
* **typeCurlySpacing** (_default **false**_) : add spaces between type curly braces
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