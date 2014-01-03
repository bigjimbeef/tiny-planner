function TemplateEngine() {
	this.poTemplates = {};
}

TemplateEngine.prototype.Assert = function(zVar, sError) {
	var bAsserted = false;
	if ( typeof(zVar) == "null" || typeof(zVar) == "undefined") {
		console.error(sError);
		bAsserted = true;
	}
	return bAsserted;
}

TemplateEngine.prototype.Init = function() {
	console.log("Initialising the template engine.");

	var eBody = $("body");

	var eFileReader	= $("<div id='file-reader'></div>");
	var eFileInput	= $("<input type='file' id='files' name='files[]' multiple />");
	var eFileOutput = $("<output id='list'></output>");

	eFileReader.append(eFileInput, eFileOutput);

	$("file-reader").remove();

	eBody.append(eFileReader);
}

TemplateEngine.prototype.Load = function(sPath, sName, fLoaded) {
	var that = this;
	$.ajax({
		url: sPath,
		dataType: "text",
		success: function(sResponse) {
			that.poTemplates[sName] = sResponse;

			fLoaded();
		}
	});
}

TemplateEngine.prototype.ExtractHTMLParams = function(sListEntry) {
	var aParams = [];

	// Now, match all parameters in the item.
	var aHTMLElements = sListEntry.match(/~(\w+)~/g);
	if ( aHTMLElements ) {

		// For all the parameters in each list item.
		var iNumParams = aHTMLElements.length;
		for ( var j = 0; j < iNumParams; ++j ) {

			var sParam = aHTMLElements[j];
			sParam = sParam.replace(/~/g, '');

			aParams.push(sParam);
		}
	}

	return aParams;
}

TemplateEngine.prototype.MatchedHTMLReplace = function(sInput, aHTMLParams, aJSElements) {
	var iNumHTMLElements = aHTMLParams.length;
	var iNumJSElements = aJSElements.length;

	var sReturnValue = "";

	for ( var i = 0; i < iNumJSElements; ++i ) {
		var oElement = aJSElements[i];
		var sSingleElement = sInput;

		for ( var j = 0; j < iNumHTMLElements; ++j ) {
			var sParam = aHTMLParams[j];

			var sMatchedContents = oElement[sParam];
			if ( this.Assert(sMatchedContents, "No matching entry for template parameter  " + sParam + "!") ) {
				return;
			}

			var sParamWithMarkers = "~" + sParam + "~";
			sSingleElement = sSingleElement.replace(sParamWithMarkers, sMatchedContents);
		}

		sReturnValue += sSingleElement;
	}

	return sReturnValue;
}

TemplateEngine.prototype.ProcessLists = function(sInput, oReplacements) {
	var sOutput = sInput;

	var aLists = sInput.match(/#LS-\w+#([^#]*)#LE#/g);
	
	if ( aLists ) {
		// If we have a list, we need list control parameters.
		if ( this.Assert(oReplacements, "Using templated list without replacements!") ) {
			return;
		}

		var iNumLists = aLists.length;
		for ( var i = 0; i < iNumLists; ++i ) {
			var sListItem = aLists[i];
			var sCachedListItem = sListItem;

			// Extract the list name.
			var aListNames = sListItem.match(/#LS-(\w+)#/);
			if ( this.Assert(aListNames, "No list name specific in template!") ) {
				return;
			}

			var sListName = aListNames[1];
			var aJavaScriptElements = oReplacements[sListName];
			if ( this.Assert(aJavaScriptElements, "No matching replacement for templated list " + sListName + "!") ) {
				return;
			}

			// Remove the list tags.
			sListItem = sListItem.replace(/#L[S|E][-\w]*#/g, '');
			var aParams = this.ExtractHTMLParams(sListItem);

			// Match the JS and HTML params.
			var sHTML = this.MatchedHTMLReplace(sListItem, aParams, aJavaScriptElements);
			
			// Overwrite the template markers in the HTML.
			sOutput = sOutput.replace(sCachedListItem, sHTML);

			delete oReplacements[sListName];
		}
	}

	return sOutput;
}

TemplateEngine.prototype.Use = function(sName, oReplacements) {
	var sSection = this.poTemplates[sName];
	if ( this.Assert(sSection, "No loaded template called " + sSection + "!") ) {
		return;
	}

	var sTrimmed = sSection.replace(/\n(\s+)/g, '');
	var sOutput = "";

	// Search for lists.
	sOutput = this.ProcessLists(sTrimmed, oReplacements);

	// Now replace individual templated params.
	var that = this;
	$.each(oReplacements, function(k, v) {
		var sTarget = "#" + k + "#";

		var aMatches = sOutput.match(sTarget);
		if ( that.Assert(aMatches, "No matching entry for " + sTarget + " in the HTML!") ) {
			return;
		}

		sOutput = sOutput.replace(sTarget, v);
	});

	return sOutput;
}

TemplateEngine.prototype.LoadInto = function(sPath, sName, oContents, eTarget) {
	var te = this;
	this.Load(sPath, sName, function() {
		var sHTML = te.Use(sName, oContents);

		// Actually make this the contents of the target.
		eTarget.html(sHTML);
	})
}