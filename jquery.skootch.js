/**
 * jQuery Skootch: The JQuery Skootch plugin allows you to easily animate items into the viewport 
 * and will shift (skootch) the already visible DOM items appropiately.
 * http://
 * 
 * @param option
 * @param arg2
 */
 
(function($) {
    
var ver = '1.0';

$.fn.skootch = function(option, arg2) {
    var o = { s: this.selector, c: this.context };
    
    return this.each(function(){
        var $trigger = $(o.s, o.c),
            opts = setParams(this, option, arg2),
            params = opts.params || null,
            nextAction = opts.nextAction || null,
            nextActionCallback = opts.nextActionCallback || null;
        
        if(nextAction !== null){
            switch(nextAction){
                case 'retreat':
                    retreat($trigger, params, nextActionCallback);
                    break;
                case 'destroy':
                    destroy($trigger, this, nextActionCallback);
                    break;
            }
        } 
        else {
            if(params !== null) {
                //the $trigger node wrapper id
                var indigenwrap = $(params.indigen).attr('id')+'-'+params.wrapperSuffix,

                //wrap $params.indigen and set '$indigenwrapper' to the res
                $indigenwrapper = $(params.indigen).wrap(function() {
                    return '<div id="'+indigenwrap+'" syle="position: relative;"/>';
                });


                var clickHandler = function(e){
                    var isinvader = false;

                    //unbind
                    $trigger.unbind(params.triggerEvent);

                    //set the isinvader true if the e.target in the invaderLinks obj
                    for(var i=0; i < $(params.invaderLinks).length; i++){
                        if(e.target === $(params.invaderLinks)[i]) { isinvader = true; }
                    }

                    //call retreat and act appropriately
                    if(isinvader === true) {
                        $trigger.bind(params.triggerEvent, clickHandler);

                        //TODO: the contents of this conditional need to be rethought and broken out into
                        //their own fn.
                        if(params.invaderClickRetreat === true){
                            retreat($trigger, params, function(){
                                //fire our callback
                                if(params.invaderClickCallback !== null){ params.invaderClickCallback(e); }
                                else {
                                    //if we are clicking on something with an href set the window.location
                                    //otherwise, rebind our click
                                    if($(e.target).attr('href') !== '' || typeof $(e.target).attr('href') !== undefined ){
                                        window.location = $(e.target).attr('href');
                                    }
                                }

                            });
                        } else {
                            //fire our callback
                            if(params.invaderClickCallback !== null){ params.invaderClickCallback(e); }
                            else {
                                //if we are clicking on something with an href set the window.location
                                //otherwise, rebind our click
                                if($(e.target).attr('href') !== '' || typeof $(e.target).attr('href') !== undefined ){
                                    window.location = $(e.target).attr('href');
                                }
                                //not a fan of this logic...
                                else if($(e.target).attr('type') === 'submit') {
                                    var $form = $(e.target).closest('form');
                                }

                            }
                        }
                    }

                    //
                    else {
                        //initial pass
                        if(typeof $(params.indigen).data('state') == 'undefined'){ 
                            $(params.indigen).data({'state': 'Closed', 'justify': params.justify});
                        }
                        //if we are closed, advance
                        if($(params.indigen).data('state') == 'Closed'){
                            advance($trigger, params, function(){
                                // rebind
                                $trigger.bind(params.triggerEvent, clickHandler);
                            });
                        }
                        //if we are open, retreat
                        else{
                            retreat($trigger, params, function(){
                                // rebind
                                $trigger.bind(params.triggerEvent, clickHandler);
                            });
                        }
                    }

                    return false;
                };

                return $('#'+$trigger.attr('id')+', '+params.invaderLinks).bind(params.triggerEvent, clickHandler);
            
            }
        }
    });
    
    
};

function setParams(node, options, arg2){
    var overrides = {},
        params = {},
        opts = {},
        nextAction = '',
        nextActionCallback = null;
    
    if(typeof options == 'object') { overrides = options; }
    
    if(typeof options == 'string') {
        switch(options){
            case 'destroy':
                nextAction = 'destroy';
                if(arg2 !== undefined && arg2.constructor == Function){ nextActionCallback = arg2; }
                break;
            case 'retreat':
                nextAction = 'retreat';
                if(arg2 !== undefined && arg2.constructor == Function){ nextActionCallback = arg2; }
                break;
            default:
                if(arg2 !== undefined){
                    for(var prop in $.fn.skootch.defaults){
                        if(prop == options) { overrides[options] = arg2; }
                    }
                }
        }
    }
    params = $.extend($.fn.skootch.defaults, overrides);
    $(node).data('skootch.params', params);
    
    opts = {nextAction: nextAction, nextActionCallback: nextActionCallback, params: params};
    return opts;
}

function setDirectionMaps($trigger, params){
    var invaderWidth = totalWidth($(params.invader), true),
        indigenSR = $(params.indigen).css(params.justify),
        indigenSA;
    
    //If the skootch is smart, we need to do determine how many px our indigen is animating.
    if(params.smart === true){
        var winWidth = $(window).width(),
            indigenWidth = totalWidth($(params.indigen), params.indigenUseMargins),
            totalElemsWidth = (invaderWidth*2) + params.minInvaderMargin + indigenWidth;
            
        if(totalElemsWidth <= winWidth) { indigenSA = 0; }
        else {
            if(winWidth <= indigenWidth ) { indigenSA = invaderWidth+params.minInvaderMargin; }
            else {
                var indigenOffset = $(params.indigen).offset();
                indigenSA = (invaderWidth+params.minInvaderMargin) - indigenOffset.left;
            }
        }
    } else {
        indigenSA = invaderWidth;
    }
    
    //create our direction maps
    var leftmap = {
        indigen_advance: {"left": "+="+indigenSA},
        indigen_retreat: {"left": "-="+indigenSR},
        invader_advance: {"left": "+="+invaderWidth},
        invader_retreat: {"left": "-="+invaderWidth}
    },
    rightmap = {
        indigen_advance: {"right": "+="+indigenSA},
        indigen_retreat: {"right": "-="+indigenSR},
        invader_advance: {"right": "+="+invaderWidth},
        invader_retreat: {"right": "-="+invaderWidth}
    };
    
    // set animap = to our desired direction map
    switch(params.justify){
        case 'left':    
            return leftmap;
        case 'right':
            return rightmap;
    }
}

function destroy($trigger, node, callback){
    var params = $(node).data('skootch.params');
    if(!params) { return false; }
    
    $(node).removeData('skootch.params');
    $trigger.unbind(params.triggerEvent);
    $(params.indigen).unwrap();
    $(params.invader+', '+params.indigen).removeAttr('style');

    if(callback !== null) { callback(); }
}

//TODO: could optimize this by not calling setDirectionMaps fn every advance/retreat.
//while this works as is, the animations use more CPU than they should.
function advance($trigger, params, animatecallback){
    if($(params.indigen).data('state') != 'Open'){
        var animap = setDirectionMaps($(params.indigen), params);
        $(params.indigen).data('state', 'Open');
    
        $('body').css({"overflow-x": "hidden"});
        $(params.indigen).css('position', 'relative').animate(animap.indigen_advance, params.advanceSpeed, params.advanceEasing);
    
        $trigger.removeClass(params.triggerClosed).addClass(params.triggerOpen);
        $(params.invader).animate(animap.invader_advance, params.advanceSpeed, params.advanceEasing, animatecallback);
    }
}

function retreat($trigger, params, animatecallback){
    if($(params.indigen).data('state') == 'Open'){
        var animap = setDirectionMaps($(params.indigen), params);
        $(params.indigen).data('state', 'Closed');

        $(params.indigen).animate(animap.indigen_retreat, params.retreatSpeed, params.retreatEasing, function(){
            $('body').css({"overflow-x": "auto"});
            $(params.indigen).removeAttr('style');
        });
    
        $trigger.removeClass(params.triggerOpen).addClass(params.triggerClosed);
        $(params.invader).animate(animap.invader_retreat, params.retreatSpeed, params.retreatEasing, animatecallback);
    }
}

//currently unused, need to figure out how to prevent rebind issue when using this fn
function invaderClickActions(e, params){
    //fire our callback
    if(params.invaderClickCallback !== null){ params.invaderClickCallback(e); }
    else {
        //if we are clicking on something with an href set the window.location
        //otherwise, rebind our click
        if($(e.target).attr('href') !== '' || typeof $(e.target).attr('href') !== undefined ){
            window.location = $(e.target).attr('href');
        }
        //not a fan of this logic...
        else if($(e.target).attr('type') === 'submit') {
            var $form = $(e.target).closest('form');
        }
        
        $trigger.bind(params.triggerEvent, clickHandler);
    }
}

function totalWidth($elem, useMargins){
    var total;
    useMargins = useMargins || false;
    
    total = $elem.width() + parseFloat($elem.css('padding-right')) + parseFloat($elem.css('padding-left'));
    if(useMargins === true) { 
        total += parseFloat($elem.css('margin-right')) + parseFloat($elem.css('margin-left'));
    }
    return total;
}
    
$.fn.skootch.ver = function() { return ver; };

$.fn.skootch.defaults = {
    advanceEasing:      'swing', //advancing easing function
    advanceSpeed:       'slow', //advancing animation speed
    indigen:            '#skootch-indigen', //the id or class name used for the element that will be skootched
    indigenUseMargins:  false, //should we use Margins to calculate the total width of the $trigger elem (the container that skootch is invoked upon) 
    invader:            '#skootch-invader', //the id or class name used element that will skootch into the window
    invaderClickCallback: null, //callback for the invaderLinks on click
    invaderClickRetreat: true, //should everything skootch back to it's start position if a invaderlink is clicked?
    invaderLinks:       '#skootch-invader a, #skootch-invader input[type=submit]', //if there are links in the invader elem these are them.
    justify:            'left', //skootch trigger justification
    minInvaderMargin:   40, //the minimum amount of margin applied to the invader elem - ONLY USED IF smart = true
    retreatEasing:      'swing', //retreating easing function
    retreatSpeed:       'slow', //retreating animation speed
    smart:              true, // should we change the amount we animate our skootched elems by based on window size?
    triggerClosed:      'skootch-trigger-closed', //trigger closed status class
    triggerEvent:       'click.skootch', //name of Event that drives Skootch 
    triggerOpen:        'skootch-trigger-open', // trigger open status class
    wrapperSuffix:      'skootch-wrap' //the div that will wrap our DOM node that will be skootched by our 'invader'
};

})(jQuery);