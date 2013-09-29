/**
* Template
* @module shared
**/

// debug flag
var debug = true;

// convert csv to json-array, http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data
var csvson = function csvson(e,t){t=t||",";var n=new RegExp("(\\"+t+"|\\r?\\n|\\r|^)"+'(?:"([^"]*(?:""[^"]*)*)"|'+'([^"\\'+t+"\\r\\n]*))","gi");var r=[[]];var i=null;while(i=n.exec(e)){var s=i[1];if(s.length&&s!=t){r.push([])}if(i[2]){var o=i[2].replace(new RegExp('""',"g"),'"')}else{var o=i[3]}r[r.length-1].push(o)}return r}

// small walker v0.1.1, 5/5/2011, http://benalman.com/ Copyright (c) 2011 "Cowboy" Ben Alman, dual licensed MIT/GPL.
var walk = function walk(a,b){var c,d,e=0;do c||(c=b.call(a,e)===!1),!c&&(d=a.firstChild)?++e:(d=a.nextSibling)?c=0:(d=a.parentNode,--e,c=1),a=d;while(e>0)};

// shim out Object.keys (ES5 15.2.3.14) borrowed from: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
if(!Object.keys){var hasDontEnumBug=true,dontEnums=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],dontEnumsLength=dontEnums.length;for(var key in{toString:null}){hasDontEnumBug=false}Object.keys=function e(t){if(typeof t!=="object"&&typeof t!=="function"||t===null){throw new TypeError("Object.keys called on a non-object")}var e=[];for(var n in t){if(t.hasOwnProperty(n)){e.push(n)}}if(hasDontEnumBug){for(var r=0,i=dontEnumsLength;r<i;r++){var s=dontEnums[r];if(t.hasOwnProperty(s)){e.push(s)}}}return e}}

// extend String prototype for IE
if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, ''); 
  }
}

/**
* helper for childNode access *
*
* @method getFirstElementNode
* @param {DOM Element} parent element 
* @return {DOM Element|Boolean} first child node or false if no non-text child nodes available
*/
var getFirstElementNode = function getFirstElementNode(node){
  for(var i=0;i<node.childNodes.length;i++) {
    if ( node.childNodes[i].nodeName != '#text' ) {
      return node.childNodes[i];
    }
  }
  return false;
}

/**
* helper processing arrays *
*
* @method arraywalk
* @param {Object} data
* @param {String} className aka attributeName aka propertyName
* @param {DOM Element} reference to parent elmeent
* @param {Object} databinder  
* @return {Boolean} mark nodes as processed (aka was an array...)
*/
var arraywalk = function arraywalk(data, className, node, databinder){

  // special processing *
  if(data[className] instanceof Array) {            
    var baseNode = node.cloneNode(true);
    var fragment = document.createDocumentFragment();

    // todo determine mode here
    var isTable = false;
    if(baseNode.outerHTML.replace(/(\r\n|\n|\r)/gm,"").substr(0, 6) == '<tbody') {
      isTable = true;
    }

    // iterate *
    data[className].forEach(function(pointerData, i){

      // special processing » prepare() => node types tbody will be turned into table/tbody / tr into ... need context aware processing
      // TODO: document iteration usage / support for node types => same for li, .. need to place array on elements differently (still allowing non-list elements to contain lists eg. div.entries ... needs to work..)
      if(isTable) {
        var fragmentTemp = wrapwalker2(baseNode.innerHTML, pointerData, 'tbody', databinder);
        fragment.appendChild(fragmentTemp.getFragment().getElementsByTagName('tr')[0]);
      } else {
        wrapwalker2(baseNode.innerHTML, pointerData, undefined, databinder).appendTo(fragment);
      }
    });
    
    // append child nodes
    node.appendChild(fragment);
    
    // remove template node
    node.removeChild(getFirstElementNode(node));
    
    // leads to not walking through nodes in calling function (yeah, we've already done that now)
    return true;
  } 

  // continue processing
  return false;
};

/**
* helper to assign an object property value to a DOM node
*
* @method assign
* @param {DOM Element} ... *
* @param {Object} data
* @param {String} className aka attributeName aka propertyName
* @return {DOM Element} clone
*/
var assign = function assign(node, pointer, className){
  if ( node.nodeType == 3 ) {
    node.nodeValue = pointer[className];
  } else if( node.nodeType == 1 ){
    if(node.nodeName=="INPUT" && (node.type=="text" || node.type=="color" || node.type=="email" || node.type=="password" || node.type=="hidden"))
      node.value = pointer[className];
    else
      node.textContent = pointer[className];
  }    
};

/**
* Returns dom node to process (either by cloning an existing node or building one from a string)
*
* @method prepare
* @param {String|DOM Element} fragment
* @param {String} optional type (tbody, ...)
* @return {DOM Element} clone
*/
var prepare = function prepare(fragment, type){
  var type = type || 'div';
  if(typeof(fragment)=='string') {
    var fragmentHTMLNode = document.createElement(type);
    fragmentHTMLNode.innerHTML = fragment;
    fragment = fragmentHTMLNode;
    /* parser = new DOMParser(), fragment = parser.parseFromString(fragment, "text/xml"); fragment = fragment.documentElement; */
  } else {
    fragment = fragment.cloneNode(true);
  }
  return fragment;
};

// TODO: remoteCSV » remote default * » callbackhandler... ! adust examples to use remotecsv instead of remote and add default callback example for remote

/**
* Retrieves content *
*
* @method remote
* @param {String} context *
* @return {Integer} next id
*/
var remote = function remote(url){
  var xmlhttp=new XMLHttpRequest();

  xmlhttp.onreadystatechange=function(){
    if(xmlhttp.readyState==4 && xmlhttp.status==200){
      var entries = [],
          converted = csvson(xmlhttp.responseText),
          headers = converted[0],
          rows = converted.slice(1);
      for(var i=0;i<rows.length;i++) {
        var entry = {};
        for(var j=0;j<headers.length;j++) {
          entry[""+headers[j]]=rows[i][j];
        }
        entries.push(entry);
      }
      var data = {
        entries: entries
      };
      boundObj3 = wrapwalker2(template3, data, undefined, databinder);
      boundObj3.appendTo(document.body);
      window.boundObj3data = data;
    }
  }
  xmlhttp.open("GET", url, true);
  xmlhttp.send();  
};

/**
* Calls all attribute bound function defined *
*
* @method map
* @param {String} context *
* @return {Integer} next id
*/
var map = function map(data, databinder, attribute, value, compile, name){
  for(var i=0; i < databinder[data.uuid].length;i++) {

    // TODO: handle functions for special updates * -> Firstname ("alias *")
    if(typeof(value)=='function') {

    }
    databinder[data.uuid][i][attribute](value);  
  }
};

/**
* Holds uuid's per context (=object.key)
* 
* @property uuidStore
* @type {Object}
* @default {}
*/  
var uuidStore = {};

/**
* Generates a unique identifier bound to the context provided
*
* @method getUUID
* @param {String} context *
* @return {Integer} *
*/
var getUUID = function getUUID(context){
  if(typeof(uuidStore[context])=='undefined') uuidStore[context] = 0;
  return uuidStore[context]++;
};

/**
* ...
*
* @method compile
* @param {String} code JavaScript source code
* @param {String} name function name (scope *)
* @param {Boolean} global flag to control whether the result will be exposed to the global context or not
* @return {Boolean} returns true if compilation succeeded
*/
var compile = function compile(code, name, global){

  // helpers 
  // TODO: think -> check params again? yes. having defaults applied in callee is an assumption :/
  var name = name || '',
      global = global || false;

  // TODO: wrap code with function block and return eval'd fnc
  if(!(code instanceof String)) return function(){ console.warn('node code block passed in'); };
};

/**
* Core function * TBD
*
* @method wrapwalker2
* @param {DOM Element|String} HTML fragment 
* @param {Object} data model 
* @param {String} type default: *blank, specials: tbody
* @param {Object} databinder  
* @param {Boolean} compile compilation flag
* @param {String} name compile function name - if not set a name is generated: 'template-' +getUUID()
* @return {Object} returns object with accessor functions for data attributes/dom nodes *
*/
var wrapwalker2 = function wrapwalker2(fragment, data, type, databinder, compile, name){
  // compile template? 
  // TODO: think -> pass back compiled function in accessor?!
  var compile = compile || false,
      // auto-generate name if not set, but compilation request 
      // TODO: think -> pass back name in accessor?!
      name = name || (compile ? 'template-'+getUUID() : '');

  // initialize data uuid
  if(typeof(data.uuid)=='undefined') {
    data.uuid = getUUID();
    data.accessor = function accessor() {return databinder[data.uuid]; };
    data.all = function all(attribute, value){ map(data, databinder, attribute, value); };
  }

  // TODO: retrieve compiled function for arrays!

  // pointer to current data object
  var pointer = data, 

    // code to compile
    code = '',

    // compiled function
    compiledFunction = null,

    // helpers holding accessor references to bind to
    compilationAccessorBindings = [],

    // databinder (adds all properties to binder returning all accessors aka widgets it's «bound to»)  
    databinder = databinder || {},

    // prepare fragment
    fragment = prepare(fragment, type),
    
    // return value *
    accessor = {

      // returns compiled function (created on first request)
      getFunction: function getFunction(){

        // compiled function available?
        if(compiledFunction==null) {

          // compile
          eval('compiledFunction = '+code);
          
          // free
          code = null;
        }

        // ...
        return compiledFunction;
      },

      // expose fragment // TODO: on debug only? hmmm.
      getFragment: function getFragment(){
        return fragment;
      },

      // fragment attachment helper
      appendTo: function appendTo(parent){ 
        parent.appendChild(fragment); 
      }

    },

    // hold nodes altered for compilation (cleaned up on function exit)
    nodesToClean = [],

    // node traversal processing helper
    walker = function walker(depth) {    
      
      // store nesting level w/ data to allow references like ../whatever => complete solve:
      // incl. array references » data-pathref="contacts[0]/friends/../friends[1]/" class="firstname"
      // means if pathref set =>  assume firstname avail!?

      // store scope reference for use in callbacks
      var node = this;

      // ...
      nodesToClean.push(node);

      // TODO: improve/remove this
      if(typeof(node.attributes)!='undefined' && node.attributes!=null) {
        
        // extract class attribute (since directly accessing node.className does not seem to be supported by all browsers.. Opera, * » documentFragment ...)
        var classAttribute = node.attributes.getNamedItem('class'),
            className = classAttribute!= null ? classAttribute.nodeValue : ""; // *Opera* fails here -> node.className;      
          
        // we're only processing nodes having a class set
        if(typeof(className)!='undefined' && className!='') {

          // TODO: check if starts with / -> adjust pointer?! -> must be recursed call to not mess up with it...!
          // TODO: compile ... *

          // pre-compilation: build function string
          if(compile) {

            // parent node
            var nodeUUID = getUUID('node'),
                parentNodeUUID = node.parentNode.getAttribute('data-node-uuid');

            // TODO: FIX parentNodeUUID fetch -> does not work for siblings except last it seems

            // set attribute of current node equal to the compiled one *
            node.setAttribute('data-node-uuid', nodeUUID);

            // build node structure
            code += '\nvar node_'+nodeUUID+' = null;';
            code += '\nnode_'+nodeUUID+' = document.createElement("'+node.tagName+'");';

            // attribute copy temp helper
            var attributes = node.attributes;

            // reflect attributes
            if(typeof(attributes)!='undefined' && attributes != null && typeof(attributes.length)!='undefined' && attributes.length>0) {

              // iteration helpers
              var index = 0,
                  count = attributes.length;

              // copy over
              for(index;index<count;index++) {
                var attribute = attributes[index];
                if(attribute.name!='data-node-uuid'){
                  code += '\nnode_'+nodeUUID+'.setAttribute("'+attribute.name+'", "'+attribute.value+'");';                
                }
              }
            }

            // append child if parent node set (depth >1)
            // TODO: really?: then why not check against depth here???
            if(typeof(parentNodeUUID)!='undefined' && parentNodeUUID!=null) {

              code += '\nnode_'+parentNodeUUID+'.appendChild(node_'+nodeUUID+');';
            }
            
            // adjust pointer based on level?!
            console.log("compile add", node.tagName, "at", depth, "code", code);      
          }

          // process data/dom mapping
          if(typeof(data[className])=='object' && data[className]!=null) { 

            // update pointer w/new scope
            pointer = data[className]; 

            // request array walk and skip further processing if successful       
            // TODO: add function to handle getting data passed in -> TODO: store return value!   
            if(arraywalk(data, className, node, databinder)) return false;
            
          // wrap attributes with helper function to assign/retrieve/update data & DOM 
          } else if(pointer!=null && typeof(pointer[className])!='undefined' && pointer[className]!=null) { 

            // request array walk and skip further processing if successful    
            // TODO: add function to handle getting data passed in -> TODO: store return value!      
            if(arraywalk(pointer, className, node, databinder)) return false;
          
            // attach delegate wrapper?
            if(typeof(accessor[className])=='undefined') {

              // wrap with function that sets the corresponding object property (if provided),
              // followed by calls to update all referenced dom nodes and finally
              // returning the current object property
              accessor[className] = function(value){
                
                // "setter"
                if(typeof(value)!='undefined') { pointer[className] = value; }                                    

                // call all dom referenced accessors
                accessor[className].functions.forEach(function(a, i){
                  a(value);
                });

                // "getter"
                return pointer[className];              
              };  

              // initialize dom node accessor functions collection
              accessor[className]['functions'] = [];
            }

            // TODO: store DOM node references (by uuid?!)
            if(compile) {

              // ...
              compilationAccessorBindings.push({ uuid: node.getAttribute('data-node-uuid'), className: className});
            }

            // attach dom node specific setter function
            accessor[className]['functions'].push(function(value){
              assign(node, pointer, className);
            });

            // initial data assignment 
            assign(node, pointer, className);

            // back-reference for inputs (TODO: textarea, select, ...)
            if(node.nodeType==1){
              if(node.nodeName=="INPUT" && (node.type=="text" || node.type=="color" || node.type=="email" || node.type=="password")){
                node.onchange = function(e) {
                  accessor[className](this.value);
                };  
                node.onkeypress = function(e) {
                  //accessor[className](node.value);
                };  
              }            
            } 
          }
        }

        console.log("accessor function", accessor[className], typeof(accessor[className])=='function');

        // inject accessor function
        if(compile) {

        }
      }
    };
  
  // TODO: retrieve compiled function for arrays!

  // walkthrough 
  walk(fragment, walker);

  // attach global databinding
  if(!(databinder[data.uuid] instanceof Array)){

    // initialize
    databinder[data.uuid] = Array();
  }

  // compilation: build function string
  if(compile) {
      
    // helper holding accessor code to inject
    var accessorCode = '\n';        

    // TODO: inject accessor function (HOW???)

    // iterate collected bindings
    compilationAccessorBindings.forEach(function(binding, i){
      accessorCode += 'node_'+binding.uuid+':'+binding.className+';';  
    });
    

    // build final code block 
    code = 'function ' + name + '(){'+(code.split('\n').join('\n\t'))+accessorCode+'\n}';
  }

  // cleanup
  nodesToClean.forEach(function(node, index){

    // don't process text nodes
    if(node.nodeName != '#text') {

      // remove temporary uuid attribute 
      // TODO: think remove
      node.removeAttribute('data-node-uuid');      
    }
  });

  // debug
  console.warn(code);      

  // attach global accessor for data *
  databinder[data.uuid].push(accessor);

  // return data accessor / dom wrapper
  return accessor;
}

true && remote("https://docs.google.com/spreadsheet/pub?key=0ApqLhg-Pef8pdHJWdDFYbjFCbnpCSUdYejJWRWVremc&single=true&gid=2&output=csv"); 
