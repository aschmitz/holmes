// Just the encoding part of http://www.json.org/json2.js, packed.
if(!this.JSON){this.JSON={}}(function(){function j(c){return c<10?'0'+c:c}if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(c){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+j(this.getUTCMonth()+1)+'-'+j(this.getUTCDate())+'T'+j(this.getUTCHours())+':'+j(this.getUTCMinutes())+':'+j(this.getUTCSeconds())+'Z':null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(c){return this.valueOf()}}var r=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,o=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,d,k,q={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},i;function p(b){o.lastIndex=0;return o.test(b)?'"'+b.replace(o,function(c){var f=q[c];return typeof f==='string'?f:'\\u'+('0000'+c.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+b+'"'}function l(c,f){var b,e,g,m,n=d,h,a=f[c];if(a&&typeof a==='object'&&typeof a.toJSON==='function'){a=a.toJSON(c)}if(typeof i==='function'){a=i.call(f,c,a)}switch(typeof a){case'string':return p(a);case'number':return isFinite(a)?String(a):'null';case'boolean':case'null':return String(a);case'object':if(!a){return'null'}d+=k;h=[];if(Object.prototype.toString.apply(a)==='[object Array]'){m=a.length;for(b=0;b<m;b+=1){h[b]=l(b,a)||'null'}g=h.length===0?'[]':d?'[\n'+d+h.join(',\n'+d)+'\n'+n+']':'['+h.join(',')+']';d=n;return g}if(i&&typeof i==='object'){m=i.length;for(b=0;b<m;b+=1){e=i[b];if(typeof e==='string'){g=l(e,a);if(g){h.push(p(e)+(d?': ':':')+g)}}}}else{for(e in a){if(Object.hasOwnProperty.call(a,e)){g=l(e,a);if(g){h.push(p(e)+(d?': ':':')+g)}}}}g=h.length===0?'{}':d?'{\n'+d+h.join(',\n'+d)+'\n'+n+'}':'{'+h.join(',')+'}';d=n;return g}}if(typeof JSON.stringify!=='function'){JSON.stringify=function(c,f,b){var e;d='';k='';if(typeof b==='number'){for(e=0;e<b;e+=1){k+=' '}}else if(typeof b==='string'){k=b}i=f;if(f&&typeof f!=='function'&&(typeof f!=='object'||typeof f.length!=='number')){throw new Error('JSON.stringify');}return l('',{'':c})}}}());

// Make sure we can use hasOwnProperty. From http://gist.github.com/332357
//  This may break object-as-hashmap in older browsers without a native hasOwnProperty. It's a tradeoff.
if ( !Object.prototype.hasOwnProperty ) {
	Object.prototype.hasOwnProperty = function(prop) {
		var proto = obj.__proto__ || obj.constructor.prototype;
		return (prop in this) && (!(prop in proto) || proto[prop] !== this[prop]);
	};
	Object.prototype.hasOwnProperty._holmesTouched = true;
}

var _holmes = {};
// We want to avoid ever recursing into these 
_holmes._scannedObjects = Array(document, window);
_holmes._functionsPatched = 0;
_holmes._followObject = function(scanObj, recursive, recursionLeft) {
	if (scanObj._holmesTouched || recursionLeft === 0 || scanObj instanceof Node ||
		(this._exclude.indexOf(scanObj) != -1)) { return; }
	
	this._scannedObjects[this._scannedObjects.length] = scanObj;
	scanObj._holmesTouched = true;
	
	// First, overwrite the prototype.
	for (var childName in scanObj.prototype) {
		if (scanObj.hasOwnProperty && scanObj.hasOwnProperty(childName) && scanObj[childName] &&
			(childName.substr(0,7) != '_holmes') && (this._exclude.indexOf(childName) == -1) &&
			scanObj[childName].hasOwnProperty && !(scanObj[childName].hasOwnProperty('_holmesTouched'))) {
			var child = scanObj[childName];
			
			if (child instanceof Function) {
				var str = child.toString();
				if ((str.length > (50+childName.length)) || (str.indexOf("[native code]") == -1)) {
					this.patchFunction(scanObj, childName, true, recursionLeft);
				}
			} else if (recursive && child && this._scannedObjects.indexOf(child) == -1 && recursionLeft > 1) {
				if (!recursionLeft) { recursionLeft = this._maxRecursion; }
				this._followObject(child, recursive, recursionLeft - 1);
			}
		}
	}
	
	// Second, scan for any other children (that aren't prototypes).
	for (var childName in scanObj) {
		if (scanObj.hasOwnProperty && scanObj.hasOwnProperty(childName) && scanObj[childName] &&
			(childName.substr(0,7) != '_holmes') && (this._exclude.indexOf(childName) == -1) &&
			scanObj[childName].hasOwnProperty && !(scanObj[childName].hasOwnProperty('_holmesTouched'))) {
			var child = scanObj[childName];
			
			if (child instanceof Function) {
				var str = child.toString();
				if ((str.length > (50+childName.length)) || (str.indexOf("[native code]") == -1)) {
					this.patchFunction(scanObj, childName, false, recursionLeft);
				}
			} else if (recursive && child && this._scannedObjects.indexOf(child) == -1 && recursionLeft > 1) {
				if (!recursionLeft) { recursionLeft = this._maxRecursion; }
				this._followObject(child, recursive, recursionLeft - 1);
			}
		}
	}
};

_holmes.patchFunction = function(ofObject, functionName, prototypeFunc, recursionLeft) {
	if (_holmes._debugging) { console.log("Patching "+functionName); }
	
	this._functionsPatched++;
	var origFunc = ofObject[functionName];
	
	// Wrap the old function
	newFunc = function() {
		var callNumber = _holmes._serialNumber++;
		var oldDebugging = _holmes._debugging;
		
		if (_holmes._debugging) { console.log("Running patched "+functionName+" with "+arguments.length+" arguments."); }
		if (_holmes._logging) { _holmes._logFunctionStart(functionName, callNumber, arguments); }
		
		if (_holmes._onlyTopFunctions) { _holmes._debugging = false; }
		var retVal = origFunc.apply(this, arguments);
		
		if (_holmes._logging) { _holmes._logFunctionEnd(functionName, callNumber, retVal); }
		
		_holmes._debugging = oldDebugging;
		return retVal;
	}
	newFunc._holmesOriginal = origFunc;
	newFunc._holmesTouched = true;
	if (prototypeFunc) {
		ofObject.prototype[functionName] = newFunc;
	} else {
		ofObject[functionName] = newFunc;
	}
	
	// Copy any "normal" properties
	for(propName in origFunc) {
		if (!(propName in ofObject[functionName]) || ofObject[functionName][propName] !== origFunc[propName]) {
			ofObject[functionName][propName] = origFunc[propName];
		}
	}
	// Copy the prototype
	for(propName in origFunc.prototype) {
		if (!(propName in ofObject[functionName].prototype) || ofObject[functionName].prototype[propName] !== origFunc.prototype[propName]) {
			ofObject[functionName].prototype[propName] = origFunc.prototype[propName];
		}
	}
	// It looks like toString may not be enumerable in the standard way, so copy that too
	if (origFunc.hasOwnProperty && origFunc.hasOwnProperty("toString") && typeof origFunc.toString != "undefined" && origFunc.toString !== ofObject[functionName].toString) {
		ofObject[functionName].toString = origFunc.toString;
	}
	
	// And convert any sub-functions.
	if (!recursionLeft) { recursionLeft = this._maxRecursion; }
	this._followObject(ofObject[functionName], true, recursionLeft - 1);
	
};

_holmes._addToLog = function(logType, logArgs) {
	if (!logArgs) { logArgs = []; }
	logArgs.unshift((new Date()).getTime(), logType);
	this._log.push(logArgs);
}
_holmes._logFunctionStart = function(funcName, callNumber, funcArgs) {
	this._addToLog('funcStart', [callNumber, this._functionStartSerializer(funcName, funcArgs)]);
};
_holmes._logFunctionEnd = function(funcName, callNumber, result) {
	this._addToLog('funcEnd', [callNumber, this._functionEndSerializer(funcName, result)]);
};

_holmes._defaultFunctionStartSerializer = function(funcName, funcArgs) {
	var args = Array();
	for (var i = 0; i < funcArgs.length; i++) {
		args[i] = (typeof(funcArgs[i]) in {'object':1, 'function':1, 'undefined':1}) ? typeof(funcArgs[i]) : funcArgs[i].toString();
	}
	return [funcName, args];
};
_holmes._defaultFunctionEndSerializer = function(funcName, result) {
	if (typeof(result) == 'undefined') { return null; }
	return (typeof(result) in {'object':1, 'function':1}) ? typeof(result) : result.toString();
};

// Set up the recorder.
_holmes.init = function(options) {
	// Reset the options
	options = options || {};
	var skipGlobals = typeof(options['skipGlobals']) == 'undefined' ? false : options['skipGlobals'];
	this._maxRecursion = typeof(options['maxRecursion']) == 'undefined' ? 5 : options['maxRecursion'];
	this._debugging = typeof(options['startNow']) == 'undefined' ? false : options['startNow'];
	this._logging = false;
	this._onlyTopFunctions = typeof(options['onlyTopFunctions']) == 'undefined' ? true : options['onlyTopFunctions'];
	this._exclude = typeof(options['exclude']) == 'undefined' ? [] : options['exclude'];
	var include = typeof(options['include']) == 'undefined' ? [] : options['include'];
	var includeNoRecurse = typeof(options['includeNoRecurse']) == 'undefined' ? [] : options['includeNoRecurse'];
	this._functionStartSerializer = typeof(options['functionStartSerializer']) == 'undefined' ? this._defaultFunctionStartSerializer : options['functionStartSerializer'];
	this._functionEndSerializer = typeof(options['functionEndSerializer']) == 'undefined' ? this._defaultFunctionEndSerializer : options['functionEndSerializer'];
	
	// Set up our patches
	var start = (new Date()).getTime();
	if (!skipGlobals) {
		this._followObject(Object, false);
		this._followObject(Function, false);
		this._followObject(window, false);
	}
	for(includedObj in include) {
		this._followObject(includedObj, true);
	}
	for(includedObj in includeNoRecurse) {
		this._followObject(includedObj, false);
	}
	var end = (new Date()).getTime();
	console.log("Monkeypatched "+this._functionsPatched+" functions in "+(end - start)+"ms.");
};

// Start logging.
_holmes.startLogging = function() {
	this._serialNumber = 0;
	this._log = Array();
	this._addToLog('start');
	this._logging = true;
};
// Stop logging.
_holmes.stopLogging = function() {
	this._addToLog('end');
	this._logging = false;
};
// Get the log back, in JSON form.
_holmes.getLog = function() {
	return JSON.stringify(this._log);
};
// Add whatever you want to the log.
_holmes.log = function(toLog) {
	this._addToLog('custom', toLog);
};

var _holmesGUI = {};
_holmesGUI.init = function(holmesOptions) {
	this._holmesDiv = document.createElement('div');
	this._holmesDiv.style.zIndex = 99999;
	this._holmesDiv.style.position = 'fixed';
	this._holmesDiv.style.padding = '3px';
	this._holmesDiv.style.border = '1px solid #000';
	this._holmesDiv.style.bottom = 0;
	this._holmesDiv.style.left = '50%';
	this._holmesDiv.style.marginLeft = '-250px';
	this._holmesDiv.style.width = '500px';
	//this._holmesDiv.style.height = 150+'px';
	this._holmesDiv.style.background = '#efe';
	this._holmesDiv.style.fontFamily = 'sans-serif';
	this._holmesDiv.style.fontSize = '12pt';
	this._holmesDiv.style.align = 'left';
	this._holmesDiv.innerHTML = '<center><strong>Holmes: Help Fix an Error</strong></center><br />When you\'re ready, click "Go," and then try to cause the error you found. Once you\'ve caused the error, just click the "Done" button that will appear here.<br /><br /><center><input type="button" value="Go" onclick="_holmesGUI.start();" /></center>';
	document.body.appendChild(this._holmesDiv);
	
	_holmes.init(holmesOptions);
}
_holmesGUI.start = function() {
	this._holmesDiv.innerHTML = 'Once you\'ve caused the error, click: <input type="button" value="Done" onclick="_holmesGUI.end();" />';
	
	setTimeout('_holmes.startLogging();', 100);
}
_holmesGUI.end = function() {
	_holmes.stopLogging();
	this._holmesDiv.innerHTML = '<center><strong>Thanks!</strong></center><br />So, we recorded what happened on this page while you caused the error. If you click "Submit" below, we\'ll take a look at the logs, and try to fix the problem. If you couldn\'t get the error to occur, or don\'t want to send us your recording, you can click "Nevermind."<br /><br /><center><form action="http://andy.lardbucket.org/holmes/submit.php" method="POST"><input type="hidden" name="log" value="" id="_holmesFormLog" /><input type="submit" value="Submit" /> <input type="button" value="Nevermind" onclick="_holmesGUI.cancel();" /></form></center>';
	setTimeout('_holmesGUI.setForm();', 0);
}
_holmesGUI.setForm = function() {
	document.getElementById('_holmesFormLog').value = _holmes.getLog();
}
_holmesGUI.cancel = function() {
	if (confirm("Are you sure you don't want to submit this log?")) {
		this._holmesDiv.style.display = 'none';
	}
}

_holmesGUI.init({
	startNow: false,
	exclude: ['$', '$E', 'Vector2', 'copy_properties', '$A', 'bind', 'hasArrayNature', 'verifyNumber', '_tx', 'intl_phonological_rules', 'intl_ends_in_punct', 'ge'],
	onlyTopFunctions: false
});
