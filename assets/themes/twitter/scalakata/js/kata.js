$.fn.openkata = function(kataOptions,codeMirrorOptions){

    'use strict';
    var actionToMode, codeMirrorDefaults, form;

    form = this;
    codeMirrorDefaults = {
        lineNumbers: true,
        matchBrackets: true,
        indentWithTabs: false,
        smartIndent: false,
        styleActiveLine: true,
        indentUnit: 2,
        tabSize: 2,
        autoClearEmptyLines: true,
        firstLineNumber: 0,
        // theme:"solarized dark"
        theme:"monokai"
    }
    codeMirrorOptions = $.extend(codeMirrorDefaults,codeMirrorOptions)

    // Show once
    if($(this).hasClass("kataifyed")) return
    $(this).addClass("kataifyed")

    $(this).find(".kata-code").each(function(){
        var options, mirror, testMirror, lang, action;
        testMirror = null;

        action = $(form).attr("action");
        lang = action.substring(action.indexOf("api/") +"api/".length,action.length);
        options = $.extend(codeMirrorOptions,{
            mode: "text/x-" + lang
        });
        mirror = CodeMirror.fromTextArea(this,options);
        $(this).data("editor", mirror);
        $(form).find(".kata-test").each(function(){
            delete options.autofocus;
            testMirror = CodeMirror.fromTextArea(this,options);
        });
        
        function runCode(){
            var $console, $result, $run, code, test;

            // disable until response from server
            $run = $(form).find("[name='run']");
            if($run.prop("disabled")) { return; }
            $run.prop("disabled",true);

            $console = $(form).find(".kata-console");
            $result = $(form).find(".kata-result")

            $console.empty();
            $result.empty();

            function pushState(code,result,success){
                var path;
                if (result.id !== undefined && kataOptions.pushState) {
                    path = "/";
                    if( -1 != window.location.pathname.indexOf("tdd") ) {
                        path = "/tdd/"
                    }
                    window.history.pushState($.extend(result,{code:code,status:success}), null, path + result.id);
                }
            }

            function renderEval(data){
                if (data.errors !== undefined ) {
                    var $errorList;
                    $console.text("Errors")
                    $errorList = $("<ol/>");
                    $result.append($errorList);
                    $.each(data.errors, function(i, error){
                        var $errorElement, $errorSeverity, $errorLine, $errorMessage;
                        error.column -= 1;
                        $errorElement = $("<li/>");
                        $errorElement.addClass("error");
                        $errorSeverity = $("<div/>")
                        $errorSeverity.text(error.severity);
                        $errorSeverity.addClass("severity");

                        function showError(error,cm,code) {
                            $errorLine = $("<div/>");
                            $errorLine.text((code ? "" : "test ") + "L" + error.line + ":" + error.column);
                            $errorLine.addClass("line");
                            $errorLine.click(function(){
                                cm.setSelection(
                                    CodeMirror.Pos(error.line,error.column),
                                    CodeMirror.Pos(error.line,Infinity)
                                );
                            });
                        };
                        
                        if(error.line < mirror.lineCount()) {
                            showError(error,mirror,true);
                        } else {
                            error.line -= mirror.lineCount();
                            showError(error,testMirror,false);
                        }
                        $errorMessage = $("<pre/>");
                        $errorMessage.text(error.message);
                        $errorMessage.addClass("message")
                        $errorElement.append($errorSeverity);
                        $errorElement.append($errorLine);
                        $errorElement.append($errorMessage);
                        $errorList.append($errorElement);
                    })
                } else {
                    $console.text(data.console);
                    $result[0].innerHTML = data.result;
                }
            }
            function renderFail(data) {
                $console.text("");
                if(data)
                    $result.text(data.error);
            }
            function renderAlways() {
               $(form).addClass("with-results");
               $run.prop("disabled",false);
            }

            // replay history
            if (kataOptions.pushState) {
                window.onpopstate = function(event) {
                    var data;
                    data = event.state;
                    if (null !== data) {
                        mirror.setValue(data.code);
                        if (true === data.status) {
                         renderEval(data);
                        } else {
                         renderFail(data);
                        }
                        renderAlways(data);
                    } else {
                        // intial state
                        mirror.setValue("");
                        $(form).removeClass("with-results");
                    }
                };
            }

            code = mirror.getValue();
            test = "";
            if(null !== testMirror) {
                test = testMirror.getValue();
            }
            var maxAttempts = 5;
            var curAttempt = 1;

            var ajaxCall = function () {
                $.ajax({
                    url: form[0].action,
                    type: "POST",
                    data: JSON.stringify({
                        code: code,
                        test: test
                    }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json"
                }).
                done(function(result){
                    renderEval(result);
                    pushState(code,result,true);
                }).
                fail(function(data){
                    if(curAttempt++ < maxAttempts) {
                        //alert("trying again");
                        setTimeout(ajaxCall, 2);
                    } else {
                        var result;
                        result = data.responseJSON;
                        renderFail(result);
                        pushState(code,result,false);
                    }
                    
                }).
                always(renderAlways);
            }
            ajaxCall();

            return false;
        }
        $(form).keydown(function(e){
            if( ( e.ctrlKey || e.metaKey ) &&               // command or ctrl +
                ( e.keyCode == 13 || e.keyCode == 83 ) ) {  // enter, (s)ave
                e.preventDefault();
                runCode();
            }
        })
        $(form).submit( function (e) {
            e.preventDefault();
            runCode();
        });
    });
};