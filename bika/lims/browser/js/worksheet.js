(function( $ ) {
$(document).ready(function(){

    window.jarn.i18n.loadCatalog("bika");
    _ = jarn.i18n.MessageFactory('bika');
    window.jarn.i18n.loadCatalog("plone");
    PMF = jarn.i18n.MessageFactory('plone');

    // selecting a template might pre-select the instrument
    $(".template").change(function(){
        templateinstruments = $.parseJSON($(".templateinstruments").val());
        instrUID = templateinstruments[$(this).val()];
        instrList = $(".instrument")[0];
        if (instrUID != ""){
            for (i=0;i<=instrList.length;i++){
                if (instrList.options[i].value == instrUID){
                    instrList.selectedIndex = i;
                    $(instrList).change()
                }
            }
        }
    });

    // search form - selecting a category fills up the service selector
    $('[name="list_getCategoryTitle"]').live("change", function(){
        val = $('[name="list_getCategoryTitle"]').val();
        if(val == 'any'){
            $('[name="list_Title"]').empty();
            $('[name="list_Title"]').append("<option value='any'>"+_('Any')+"</option>");
            return;
        }
        $.ajax({
            url: window.location.href.split("?")[0].replace("/add_analyses","") + "/getServices",
            type: 'POST',
            data: {'_authenticator': $('input[name="_authenticator"]').val(),
                   'getCategoryTitle': val},
            dataType: "json",
            success: function(data, textStatus, $XHR){
                current_service_selection = $('[name="list_Title"]').val();
                $('[name="list_Title"]').empty();
                $('[name="list_Title"]').append("<option value='any'>"+_('Any')+"</option>");
                for(i=0; i<data.length; i++){
                    if (data[i] == current_service_selection){
                        selected = 'selected="selected" ';
                    } else {
                        selected = '';
                    }
                    $('[name="list_Title"]').append("<option "+selected+"value='"+data[i]+"'>"+data[i]+"</option>");
                }
            }
        });
    });
    $('[name="list_getCategoryTitle"]').trigger("change");

    // adding Controls and Blanks - selecting services re-renders the list
    // of applicable reference samples
    function get_updated_controls(){
        selected_service_uids = [];
        $.each($("input:checked"), function(i,e){
            selected_service_uids.push($(e).val());
        });

        if (window.location.href.search('add_control') > -1) {
          control_type = 'c';
        } else {
          control_type = 'b';
        }

        url = window.location.href
            .replace("/add_blank", "")
            .replace("/add_control", "") + "/getWorksheetReferences"
        element = $("#worksheet_add_references");
        if(element.length > 0){
            $(element).load(url,
                {'service_uids': selected_service_uids.join(","),
                 'control_type': control_type,
                 '_authenticator': $('input[name="_authenticator"]').val()},
                function(responseText, statusText, xhr, $form) {
                }
            );
        };
    };
    $("#worksheet_services input[id*='_cb_']").live('click', function(){
        get_updated_controls();
    });
    // get references for selected services on first load
    get_updated_controls();

    // click a Reference Sample in add_control or add_blank
    $("#worksheet_add_references .bika-listing-table tbody.item-listing-tbody tr").live('click', function(e){
        // we want to submit to the worksheet.py/add_control or add_blank views.
        if (e.target.src != undefined) {
            return;
        }
        if(window.location.href.search('add_control') > -1){
            $(this).parents('form').attr("action", "add_control");
        } else {
            $(this).parents('form').attr("action", "add_blank");
        }
        // tell the form handler which services were selected
        selected_service_uids = [];
        $.each($("input:checked"), function(i,e){
            selected_service_uids.push($(e).val());
        });
        ssuids = selected_service_uids.join(",");
        $(this).parents('form').append("<input type='hidden' value='"+ssuids+"' name='selected_service_uids'/>");
        // tell the form handler which reference UID was clicked
        $(this).parents('form').append("<input type='hidden' value='"+$(this).attr("uid")+"' name='reference_uid'/>");
        // add the position dropdown's value to the form before submitting.
        $(this).parents('form').append("<input type='hidden' value='"+$('#position').val()+"' name='position'/>");
        $(this).parents('form').submit();
    });

    // click an AR in add_duplicate
    $("#worksheet_add_duplicate_ars .bika-listing-table tbody.item-listing-tbody tr").live('click', function(){
        // we want to submit to the worksheet.py/add_duplicate view.
        $(this).parents('form').attr("action", "add_duplicate");
        // add the position dropdown's value to the form before submitting.
        $(this).parents('form')
            .append("<input type='hidden' value='"+$(this).attr("uid")+"' name='ar_uid'/>")
            .append("<input type='hidden' value='"+$('#position').val()+"' name='position'/>");
        $(this).parents('form').submit();
    })

    // add_analyses analysis search is handled by bika_listing default __call__
    $('.ws-analyses-search-button').live('click', function(event) {
        // in this context we already know there is only one bika-listing-form
        form_id = "list";
        form = $("#list");

        // request new table content by re-routing bika_listing_table form submit
        stored_form_action = $(form).attr("action");
        $(form).attr("action", window.location.href);
        $(form).append("<input type='hidden' name='table_only' value='"+form_id+"'>");

        // dropdowns are printed in ../templates/worksheet_add_analyses.pt
        // We add list_<bika_analysis_catalog args>, which go
        // into contentFilter in bika_listing.py
        getCategoryTitle = $("[name='list_getCategoryTitle']").val();
        Title = $("[name='list_Title']").val();
        getClientTitle = $("[name='list_getClientTitle']").val();
        if (getCategoryTitle != 'any')
            $(form).append("<input type='hidden' name='list_getCategoryTitle' value='"+getCategoryTitle+"'>");
        if (Title != 'any')
            $(form).append("<input type='hidden' name='list_Title' value='"+Title+"'>");
        if (getClientTitle != 'any')
            $(form).append("<input type='hidden' name='list_getClientTitle' value='"+getClientTitle+"'>");

        options = {
            target: $('.bika-listing-table'),
            replaceTarget: true,
            data: form.formToArray(),
            success: function(){
            }
        }
        form.ajaxSubmit(options);

        $("[name='table_only']").remove();
        $("#list > [name='list_getCategoryTitle']").remove();
        $("#list > [name='list_Title']").remove();
        $("#list > [name='list_getClientTitle']").remove();
        $(form).attr("action", stored_form_action);
        return false;
    });

    function portalMessage(message) {
        window.jarn.i18n.loadCatalog("bika");
        _ = jarn.i18n.MessageFactory('bika');
        str = "<dl class='portalMessage info'>"+
            "<dt>"+_('Info')+"</dt>"+
            "<dd><ul>" + _(message) +
            "</ul></dd></dl>";
        $('.portalMessage').remove();
        $(str).appendTo('#viewlet-above-content');
    }

    $(".manage_results_header .analyst").change(function(){
        if ($(this).val() == '') {
            return false;
        }
        $.ajax({
          type: 'POST',
          url: window.location.href.replace("/manage_results", "") + "/setAnalyst",
          data: {'value': $(this).val(),
                 '_authenticator': $('input[name="_authenticator"]').val()},
          success: function(data, textStatus, jqXHR){
               portalMessage("Changes saved.");
          }
        });
    });

    $(".manage_results_header .instrument").change(function(){
        $("#content-core .instrument-error").remove();
        var instruid = $(this).val();
        if (instruid == '') {
            return false;
        }
        $.ajax({
          type: 'POST',
          url: window.location.href.replace("/manage_results", "") + "/set_instrument",
          data: {'value': instruid,
                  '_authenticator': $('input[name="_authenticator"]').val()},
          success: function(data, textStatus, jqXHR){
               portalMessage("Changes saved.");
               // Set the selected instrument to all the analyses which
               // that can be done using that instrument. The rest of
               // of the instrument picklist will not be changed
               $('select.listing_select_entry[field="Instrument"] option[value="'+instruid+'"]').parent().find('option[value="'+instruid+'"]').prop("selected", false);
               $('select.listing_select_entry[field="Instrument"] option[value="'+instruid+'"]').prop("selected", true);
          },
          error: function(data, jqXHR, textStatus, errorThrown){
                $(".manage_results_header .instrument")
                    .closest("table")
                    .after("<div class='alert instrument-error'>" +
                        _("Unable to apply the selected instrument") + "</div>");
                return false;
          }
        });
    });

    // Manage the upper selection form for spread wide interim results values
    $("#wideinterims_analyses").change(function(){
        $("#wideinterims_interims").html('');
        $('input[id^="wideinterim_'+$(this).val()+'"]').each(function(i, obj) {
            itemval = '<option value="'+ $(obj).attr('keyword') +'">'+$(obj).attr('name')+'</option>';
            $("#wideinterims_interims").append(itemval);
        });
    });
    $("#wideinterims_interims").change(function(){
        analysis = $("#wideinterims_analyses").val();
        interim = $(this).val();
        idinter = "#wideinterim_"+analysis+"_"+interim;
        $("#wideinterims_value").val($(idinter).val());
    });
    $("#wideinterims_apply").click(function(event) {
            event.preventDefault();
            analysis=$("#wideinterims_analyses").val();
            interim=$("#wideinterims_interims").val();
            $('tr[keyword="'+analysis+'"] input[field="'+interim+'"]').each(function(i, obj) {
                if ($('#wideinterims_empty').is(':checked')) {
                    if ($(this).val()=='' || $(this).val().match(/\d+/)=='0') {
                        $(this).val($('#wideinterims_value').val());
                        $(this).change();
                    }
                } else {
                    $(this).val($('#wideinterims_value').val());
                    $(this).change();
                }
            });
    });

    // Change the instruments to be shown for an analysis when the method selected changes
    $('table.bika-listing-table select.listing_select_entry[field="Method"]').change(function() {
        var manualentry = true;
        var methodname = '';
        var muid = $(this).val();
        if (muid) {
            // Update the instruments selector
            $(this).closest('tr').find('img.alert-instruments-invalid').remove();
            var instrselector = $(this).closest('tr').find('select.listing_select_entry[field="Instrument"]');
            var selectedinstr = $(instrselector).val();
            $(instrselector).find('option').remove();

            // Is manual entry allowed for this method?
            var request_data = {
                catalog_name: "uid_catalog",
                UID: muid
            };
            window.bika.lims.jsonapi_read(request_data, function(data) {
                if (data.objects && data.objects.length > 0) {
                    manualentry = data.objects[0].ManualEntryOfResults;
                    methodname = data.objects[0].Title;
                }
                $(instrselector).closest('tr').find('td.interim input').prop('disabled', !manualentry);
                $(instrselector).closest('tr').find('td.Result input').prop('disabled', !manualentry);
                if (!manualentry) {
                    var title = _("Manual entry of results for method %s is not allowed").replace('%s', methodname);
                    $(instrselector).closest('tr').find('td.Result input').parent().append('<img class="alert-instruments-invalid" src="'+window.portal_url+'/++resource++bika.lims.images/warning.png" title="'+title+'")">');
                }
            });

            // Get the available instruments for the method
            $.ajax({
                url: window.portal_url + "/get_method_instruments",
                type: 'POST',
                data: {'_authenticator': $('input[name="_authenticator"]').val(),
                       'uid': muid },
                dataType: 'json'
            }).done(function(data) {
                var invalid = []
                var valid = false;
                $.each(data, function(index, value) {
                    if (value['isvalid'] == true) {
                        var selected = "";
                        if (selectedinstr == value['uid']) {
                            selected = "selected";
                        }
                        $(instrselector).append('<option value="'+value['uid']+'" '+selected+'>'+value['title']+'</option>');
                        valid = true;
                    } else {
                        invalid.push(value['title'])
                    }
                });
                if (!valid) {
                    if (manualentry) {
                        $(instrselector).append('<option selected value="">'+_('None')+'</option>');
                        $(instrselector).prop('disabled', false);
                    } else {
                        $(instrselector).prop('disabled', true);
                    }
                } else if (manualentry) {
                    $(instrselector).prepend('<option value="">'+_('None')+'</option>');
                    $(instrselector).prop('disabled', false);
                }
                if (invalid.length > 0) {
                    if (valid) {
                        var title = _("Invalid instruments are not shown: ")+invalid.join(", ");
                        $(instrselector).parent().append('<img class="alert-instruments-invalid" src="'+window.portal_url+'/++resource++bika.lims.images/warning.png" title="'+title+'")">');
                    } else if (!valid) {
                        var title = _("Manual entry of results for method %s is not allowed and no valid instruments found: ").replace('%s', methodname) + invalid.join(", ");
                        $(instrselector).parent().append('<img class="alert-instruments-invalid" src="'+window.portal_url+'/++resource++bika.lims.images/exclamation.png" title="'+title+'")">');
                        $(instrselector).closest('tr').find('td.interim input').prop('disabled', true);
                        $(instrselector).closest('tr').find('td.Result input').prop('disabled', true);
                    }
                }
            }).fail(function() {
                $(instrselector).append('<option selected value="">'+_('None')+'</option>');
                if (!manualentry) {
                    var title = _("Unable to load instruments: ")+invalid.join(", ");
                    $(instrselector).parent().append('<img class="alert-instruments-invalid" src="'+window.portal_url+'/++resource++bika.lims.images/exclamation.png" title="'+title+'")">');
                    $(instrselector).prop('disabled', true);
                } else {
                    $(instrselector).prop('disabled', false);
                }
            });

        } else {
            // Clear instruments selector / No method selected
            $(instrselector).find('option').remove();
            $(instrselector).append('<option selected value="">'+_('None')+'</option>');
            $(instrselector).prop('disabled', false);
            $(instrselector).closest('tr').find('td.interim input').prop('disabled', false);
            $(instrselector).closest('tr').find('td.Result input').prop('disabled', false);
        }
    });

    // Remove empty options
    $('table.bika-listing-table select.listing_select_entry[field="Instrument"]').find('option[value=""]:not(:selected)').remove();
    $('table.bika-listing-table select.listing_select_entry[field="Method"]').find('option[value=""]').remove();
    $('table.bika-listing-table select.listing_select_entry[field="Method"]').change();

    $('div.worksheet_add_controls select.instrument').change(function() {
        var val = $(this).val();
        $('div.worksheet_add_controls div.alert').remove();
        if (val != '' && val != null) {
            $('div.worksheet_add_controls').append('<div class="alert">'+_("Only the analyses for which the selected instrument is allowed will be added automatically.")+'</div>');
        }
    });


   // Add a baloon icon before Analyses' name when you'd add a remark. If you click on, it'll display remarks textarea.

    var txt1 = '<a href="#" class="add-remark"><img src="'+window.portal_url+'/++resource++bika.lims.images/comment_ico.png" title="'+_('Add Remark')+'")"></a>';
    
    $(".listing_remarks:contains('')").closest('tr').hide();
    var pointer = $(".listing_remarks:contains('')").closest('tr').prev().find('td.service_title span.before');
    $(pointer).append(txt1);

    $("a.add-remark").click(function(e){
	e.preventDefault();
	$(this).closest('tr').next('tr').toggle(300);
    });


});
}(jQuery));
