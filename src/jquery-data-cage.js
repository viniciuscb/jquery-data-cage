// jQuery Data-Cage
// (c) 2012 Vinicius Cubas Brand, Raphael Derosso Pereira, RMI (www.rmi.inf.br)
// Distributed Under MIT License

var cbs_form_manager = null;


(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['underscore','jquery'], factory);
    } else {
        // Browser globals
        factory(_,jQuery);
    }
}(function(_,jQuery){

    var jQueryDataCage = function () {
        this.current_context = null;

        this.exit_dialog = jQuery('<div></div>')
            .html('There is changed data in this form.<br/>Do you want to save these changes?')
            .dialog({
                    autoOpen: false,
                    modal: true,
                    resizable: false,
                    draggable: false
            });


        var context_manager = this;
        jQuery('a,input,button,select,textarea').on('mousedown',function(e) {
            if (context_manager.exit_dialog.dialog('isOpen') || cbs_error_message.isShown()) { return true; }

            //verifica o contexto atual
            var new_context = context_manager._get_context(this);
            
            //verifica se mudou contexto de um form
            if (context_manager.current_context != new_context) {

                if (context_manager.current_context == null) {
                    context_manager._change_context(new_context);
                } else {
                    var old_form = jQuery(context_manager.current_context);

                    if (old_form.length > 0 && old_form.attr('data-cage-changed') == "true") {

                        context_manager.exit_dialog.dialog({
                            buttons: {
                                "yes": function() {
                                    if (old_form.data('remote')) {
                                        old_form.trigger('submit.rails');
                                    } else {
                                        old_form.trigger('submit'); //this is for Backbone
                                    }
                                    old_form.data('link-click',e.target);
                                    jQuery( this ).dialog( "close" );
                                },
                                "no": function() {
                                    jQuery( this ).dialog( "close" );
                                    context_manager._change_context(new_context);

                                    var me = document.createEvent('MouseEvents');
                                    me.initEvent( 'click', true, true );
                                    e.target.dispatchEvent(me);
                                }
                            }});

                        context_manager.exit_dialog.dialog('open');
                        return false;
                    } else {
                        context_manager._change_context(new_context);
                    }
                }
            }

            return true;
        }).on('keydown change',function() {
            jQuery(this).closest('[data-cage-changed]').attr('data-cage-changed','true')
        })
        
    };

    jQueryDataCage.prototype.initialize = function() {
        _(this).bindAll('success')
    };

    //options:
    //  - commit   : callback to execute when the 'commit' button is clicked
    //  - rollback : callback to execute when the 'rollback' button is clicked
    //  - close    : callback to execute when the 'close' button is clicked

    //  - dialog_message: message to be shown when the dialog appears
    //  - dialog_commit_button_name: name of the commit button (default: yes)
    //  - dialog_rollback_button_name: name of the rollback button (default: no)

    //  - enterContext : [optional] callback to execute when entering this context
    //  - exitContext  : [optional] callback to execute when exiting this context
    // :exitContext,passar caso seja necessário, esses callbacks irão executar

    // depois da resposta da confirmação se houve mudança de contexto
    jQueryDataCage.prototype.register = function(form_selector, options) {

        if (options == null) { options = { }}
        var data_cage_callbacks = {};
        if (options.commit   != null) { data_cage_callbacks['data_cage.commit']   = options.commit; }
        if (options.rollback != null) { data_cage_callbacks['data_cage.rollback'] = options.rollback; }
        if (options.close    != null) { data_cage_callbacks['data_cage.close'] = options.close; }

        if (options.enterContext != null) { data_cage_callbacks['data_cage.enterContext'] = options.enterContext; }
        if (options.exitContext  != null) { data_cage_callbacks['data_cage.exitContext'] = options.exitContext; }

        var data_cage_options = {};
        if (options.dialog_message  != null) { data_cage_options['data_cage.dialog_message'] = options.dialog_message; }
        if (options.dialog_commit_button_name  != null) { data_cage_options['data_cage.dialog_commit_button_name'] = options.dialog_commit_button_name; }
        if (options.dialog_rollback_button_name  != null) { data_cage_options['data_cage.dialog_rollback_button_name'] = options.dialog_rollback_button_name; }
        
        var form = jQuery(form_selector);

        form.attr('data-cage-changed','false').on(data_cage_callbacks);

        _(data_cage_options).each(function(option,key) {
            form.data(key,option);
        });
    };

    jQueryDataCage.prototype.unregister = function(form_selector) {
        var form = jQuery(form_selector)
            .unbind('data_cage.enterContext')
            .unbind('data_cage.exitContext')
            .attr('data-cage-changed',null);
    };

    // Behavior when insert/update was wellsucceded: alert success and exec
    // custom code
    jQueryDataCage.prototype.success = function() {
        var success_dialog = jQuery('<div></div>')
            .html('The changes were saved successfully.')
            .dialog({
                modal: true,
                resizable: false,
                draggable: false,
                //height: 140,
                open: function (event,ui) {
                    setTimeout(function() { jQuery(event.target).dialog('close')},1500)
                }
            });

        var link_click = jQuery(this.current_context).data('link-click');

        if (link_click) {
            //This below did not work when the click in on an ANCHOR element
            //jQuery(link_click).trigger('click')

            //This solution is not proved to work in Internet Explorer
            var e = document.createEvent('MouseEvents');
            e.initEvent( 'click', true, true );
            link_click.dispatchEvent(e);

            this._change_context(this._get_context(link_click))
        }

    }

    // Behavior when insert/update was malsucceded: treat errors and exec custom
    // code
    jQueryDataCage.prototype.fail = function(form_id, errors) {
        cbs_error_message.show('Could not save. Correct the errors and try again.');
    };

    //Obtém o contexto de um elemento dom qualquer
    jQueryDataCage.prototype._get_context = function(dom_element) {
        return jQuery(dom_element).closest('[data-cage-changed]')[0] || null
    };

    //just changes the context, resetting the data-cage-changed to false
    jQueryDataCage.prototype._change_context = function(new_context) {
        //verifica se mudou contexto de um form
        if (this.current_context != new_context) {
            //saindo de um contexto: somente se o callback der resultado == true,
            //sai do contexto
            if (this.current_context != null) {
                this.previous_data_changed = jQuery(this.current_context).attr('data-cage-changed');
                jQuery(this.current_context)
                    .attr('data-cage-changed','false')
                    .trigger('data_cage.exitContext')
            }

            //stores previous context due to make 'undo context change' operation possible
            this.previous_context = this.current_context;
            this.current_context = new_context;

            //entrando em um contexto novo
            if (new_context != '') {
                jQuery(new_context).trigger('data_cage.enterContext')
            }
        }
    };

    jQueryDataCage.prototype.return_to_previous_context = function() {
        if (this.previous_context != null) {
            jQuery(this.current_context)
                .attr('data-cage-changed','false');
            this.current_context = this.previous_context;
            jQuery(this.current_context).attr('data-cage-changed',this.previous_data_changed);
            this.previous_context = null;
            this.previous_data_changed = null;
        }
    };

    jQuery(document).ready(function() {
        cbs_form_manager = new jQueryDataCage();
        cbs_form_manager.initialize();
    });


}));
