/**
 * Copyright (C) 2011 - RMI
 *
 * Todos os direitos reservados.
 * (9)
 */

var cbs_error_showing = false;
function cbs_display_error(id, message) {
 if (!cbs_error_showing) {
    cbs_error_showing = true;
    jQuery('#'+id+'_errors_message').html(message);
    jQuery('#'+id+'_errors').show('bounce');
    setTimeout(function () {
        jQuery('#'+id+'_errors').hide('fold');
        cbs_error_showing = false;
    }, 3000);
 }
}


var cbs_error_message = false;
CbsErrorMessage = function() {};
_.extend(CbsErrorMessage.prototype, {
    show : function(message) {
        this.dialog = jQuery('<div></div>')
            .html(message)
            .dialog({
                modal: true,
                resizable: true,
                draggable: true,
                height: 140,
                buttons: {
                    OK: function() { jQuery(this).dialog('close') }
                }
            });
    },

    isShown : function() {
        if (this.dialog == null) return false;
        return this.dialog.dialog('isOpen');
    },

    initialize: function() {
        _(this).bindAll('modelSaveError','jQueryAjaxError','ajaxError','isShown','show');
    },

    ajaxError: function(jqXHR) {
        var error_messages = '';

        try {
            var errors = jQuery.parseJSON(jqXHR.responseText).errors;
            jQuery.each(errors,function(attribute, messages) {
                jQuery.each(messages,function(key,message) {
                    error_messages += attribute + ": " + message + "<br/>\n"
                })
            });
        } catch (err) {
            error_messages = 'Error: ' + jqXHR.status;
            error_messages += jqXHR.responseText;
        }

        this.show(error_messages);
    },

    modelSaveError: function(model,response) {
        this.ajaxError(response);
    },

    jQueryAjaxError: function (jqXHR, textStatus, errorThrown) {
        this.ajaxError(jqXHR);
    }
});

cbs_error_message = new CbsErrorMessage();
cbs_error_message.initialize();
