var showsjson = "";
var fileName= "";
var scroll_value=[45,240];
var index=-1;
var leftPannelVisible = true;

var contentName="";
var contentId="";
var contentDuration="";
var contentFile="";
var rowId=0;
var clip_list = [];
var clippy_tableDataRow;
var jobid;

var colors=['#C0C0C0','#0099FF','#33FFFF','#6699FF','#99FFFF','#CC99FF','#FFCCFF','#FFFFCC','#CCFF99','#99FF99'];
var buttonToggle=false;

var cut_duration = 0;
var filePath= "";

var status_url;
var channel_url;
var video_url;
var clippy_url
var current_channel;

Array.prototype.move = function(from,to){
  this.splice(to,0,this.splice(from,1)[0]);
  return this;
};

function notifier(title,text,type){
     $.pnotify({
        title: title,
        text: text,
        type: type
    });
}

function durationToTime(totalSeconds){
    return moment.duration(totalSeconds, "seconds").format("hh:mm:ss",{ trim:false })
}

function timeToSeconds(timeFormat){
    return moment.duration(timeFormat,"hh:mm:ss").asSeconds()
}

function changeSlider(index,type){
    var hrTag,minTag,secTag;
    index==0 ? (hrTag='#s_hr',minTag='#s_min',secTag='#s_sec'):(hrTag='#e_hr',minTag='#e_min',secTag='#e_sec');
    scroll_value[index] = timeToSeconds(parseInt($(hrTag).val())+':'+parseInt($(minTag).val())+':'+parseInt($(secTag).val()));
    refreshUI(false);
}

/*function called after up/down arrow are released to update slider value , images*/
function adjustSliderValue(){
   if(scroll_value[0]>scroll_value[1]){
        scroll_value[1]=[scroll_value[0], scroll_value[0]=scroll_value[1]][0];
        index==0?index=1:index=0;
    }
    refreshUI(true);
}

function calculateDuration(rangeValue){
    return durationToTime(Math.abs(rangeValue[1]-rangeValue[0]));
}

/*to detect which slider range  changed*/
function detectChangedIndex(value){
    if(scroll_value[0]!=value[0]){
        scroll_value[0]=value[0];
        index=0;
    }
    else if(scroll_value[1]!=value[1]){
        scroll_value[1]=value[1];
        index=1;
    }
}

function enableTags(){
    $('#s_hr').attr('disabled',false);
    $('#s_hr_up').attr('disabled',false);
    $('#s_hr_down').attr('disabled',false);
    $('#s_min').attr('disabled',false);
    $('#s_min_up').attr('disabled',false);
    $('#s_min_down').attr('disabled',false);
    $('#s_sec').attr('disabled',false);
    $('#s_sec_up').attr('disabled',false);
    $('#s_sec_down').attr('disabled',false);
    $('#e_hr').attr('disabled',false);
    $('#e_hr_up').attr('disabled',false);
    $('#e_hr_down').attr('disabled',false);
    $('#e_min').attr('disabled',false);
    $('#e_min_up').attr('disabled',false);
    $('#e_min_down').attr('disabled',false);
    $('#e_sec').attr('disabled',false);
    $('#e_sec_up').attr('disabled',false);
    $('#e_sec_down').attr('disabled',false);
    $('#cut_clip').attr('disabled', false);
    $("#nameDisplay").html(contentName);
}

function initializeTags(id,sName,sDuration){
    contentName= sName;
    contentId = id;
    contentDuration = sDuration;
    scroll_value=[0,240];
    index=-1;
    fileName= filePath + id + '_';
    enableTags();
    refreshUI(true);
}

function makeRulerValues(duration){
    var rule= new Array();
    for(var i=0;i<=Math.ceil(duration/60);i=i+5)
    {
        rule.push(i);
        rule.push('|')
    }
    rule.pop();
    return rule;
}

function changeTimeNsrc(value,i,tagName,tagType,imageUpdate){
    $slider = $('#slider');
    $slider.slider('setValue',scroll_value);

    $( "#duration" ).html(calculateDuration(value));

    var duration=moment.duration(value[i],'seconds')
    $(tagType+'hr').val(duration.hours());
    $(tagType+'min').val(duration.minutes());
    $(tagType+'sec').val(duration.seconds());

    $(tagType + 'time_display').html(duration);
    if(imageUpdate)
    {
        var imageIndex =  value[i]+1;
        var image_name= fileName+ imageIndex + "_160x90.jpg";
        $(tagName).attr('src', image_name);
    }
}

function refreshUI(imageUpdate){
    changeTimeNsrc(scroll_value,0,'#start_tag','#s_',imageUpdate);
    changeTimeNsrc(scroll_value,1,'#stop_tag','#e_',imageUpdate);
}

function drawSpinners(){
    $("input[name='e_sec']").TouchSpin({
        min: -1,
        max: 60,
        step:1,
        button_name:'e_sec'
    });
    $("input[name='e_min']").TouchSpin({
        min: -1,
        max: 60,
        step:1,
        button_name:'e_min'
    });
    $("input[name='e_hr']").TouchSpin({
        min: 0,
        max: 1,
        step:1,
        button_name:'e_hr'
    });
    $("input[name='s_sec']").TouchSpin({
        min: -1,
        max: 60,
        step:1,
        button_name:'s_sec'
    });
    $("input[name='s_min']").TouchSpin({
        min: -1,
        max: 60,
        step:1,
        button_name:'s_min'
    });
    $("input[name='s_hr']").TouchSpin({
        min: 0,
        max: 1,
        step:1,
        button_name:'s_hr'
    });
    $('#s_time_display').html('00:00:00');
    $('#e_time_display').html('00:00:00');
    $('#cut_duration').html('Total Cut Duration  00:00:00');
}

function getTitle(){
    var title = "";
    var ldate = moment($('#air_date').val(),'DD-MM-YYYY');
    if($('#channel_show option:selected').val() != -1)
        title = $('#channel_show option:selected').text()
    if(ldate.isValid())
        title = title + " " + ldate.format('DD MMM YYYY')
    return title.trim();
}

function toggleStatus(iD,curStatus){
    buttonToggle = true;
    bootbox.confirm("Are you sure you want to change Status?", function(result) {
        if(result) {
            var status ='pe';
            if (curStatus=='Pending') {
                status='pc';
            }
            $.ajax({
                type: "POST",
                url: status_url,
                data:{status:status,id:iD},
                success: function() {
                    notifier('Success',"Status changed",'success')
                   $('#clippy_tableData').bootstrapTable('selectPage', 1);
                },
                error: function(data) {
                    notifier('Error',"Unable to change content's status",'error')
                }
            });
        }
    });
}

$(function(){
    Handlebars.registerHelper('duration_fmt', function(duration) {
        return durationToTime(duration);
    });

    $('#channel_show').change(function(ev){
        if($(ev.target.selectedOptions).val() === '-1')
        {
            $('#description').val('');
            $('#title').val('');
            $('#tags').val('');
            return false;
        }
        show_rowid  = $(ev.target.selectedOptions).val();
        showObj     = showsjson[$('#channel_show')[0].selectedIndex -1 ];
        $('#title').val(getTitle());
        $('#description').val(showObj['desc']);
        $('#tags').val(showObj['tags']);
        return false;
    });

    $( "#clippedForm" ).submit(function( event ) {
        if($('#channel_show').val() === '-1' || $('#channel_show').val() == null) {
            alert('Select valid show');
            event.preventDefault();
        }

        else if($('#air_date').val() == '') {
            alert('Please enter an air date');
            event.preventDefault();
        }

        else if(/#.+?#/g.test($('#tags').val())) {
            alert('Please replace ' + $('#tags').val().match(/#.+?#/g) +' with valid values in "Tags"');
            event.preventDefault();
        }
        else if(/#.+?#/g.test($('#description').val())) {

            alert('Please replace ' + $('#description').val().match(/#.+?#/g) +' with valid values in "Description"');
            event.preventDefault();
        }
        else
        {
            $('#clip_list').val(JSON.stringify(clip_list));
            localStorage.clear();
        }
    });

    drawSpinners();
    $.pnotify.defaults.styling = "bootstrap3";
    $.pnotify.defaults.history = false;

    $('#air_date').datepicker({
        format: "dd-mm-yyyy",
        todayBtn: "linked",
        autoclose: true,
        todayHighlight: true
    }).on('changeDate', function(e){
        $('#title').val(getTitle());
    });
});

function getStartTime(){
    return sprintf('%02s:%02s:%02s', $('#s_hr').val(), $('#s_min').val(), $('#s_sec').val());
}

function getEndTime(){
    return sprintf('%02s:%02s:%02s', $('#e_hr').val(), $('#e_min').val(), $('#e_sec').val());
}

function drawSlider(name){
    contentDuration = contentDuration-1
    $( name ).slider({
        value:scroll_value,
        min:0,
        step:1,
        max: contentDuration,
        enabled:false,
        rule:'',
        tooltip:'always',
        formater: function(ui) {
            return durationToTime(ui);
        },
        selectionColor:  'style="background:'+colors[(rowId+2)%10]+'"'
    });
}

function prepareContext(data){
    context = {
        name            : (data ? data.name : contentName),
        content_id      : (data ? data.content_id : contentId),
        startTime       : (data ? durationToTime(data.startTime) : getStartTime()),
        endTime         : (data ? durationToTime(data.endTime) : getEndTime()),
        duration        : (data ? durationToTime(data.duration) : durationToTime(timeToSeconds(getEndTime())-timeToSeconds(getStartTime()))),
        rowID           : rowId,
        stopScroll      : (data ? (typeof(data.endTime)=='number' ? scroll_value[1]= data.endTime : scroll_value[1]=timeToSeconds(data.endTime)) : scroll_value[1]),
        startScroll     : (data ? (typeof(data.startTime)=='number' ? scroll_value[0]= data.startTime : scroll_value[0]=timeToSeconds(data.startTime)) : scroll_value[0]),
        startClip       : data ? fileName + data.startTime + "_160x90.jpg" : $('#start_tag').attr('src'),
        endClip         : data ? fileName + data.endTime + "_160x90.jpg" : $('#stop_tag').attr('src'),
        clip_id         : (data ? data.clip_id : 0),
    };

    return context;
}

function load_previous_job(row,data){
    if(clip_list.length){
        clearForm()
    }

    for(var i=0;i<data['clips'].length;i++){
        context=prepareContext(data['clips'][i]);
        if(data['clips'][i]['clip_id']){
            context['clip_id'] = data['clips'][i]['clip_id'];    
        }
        addData(context,true);
    }
    $('#tbl_jobs').bootstrapTable({data: row.jobs});
    
    $('#channel_show').val(data['channel_show'])
    $('#air_date').datepicker("update",moment(data['air_date']).format('DD-MM-YYYY'));
    $('#title').val(data['title']);
    $('#tags').val(data['tags']);
    $('#description').val(data['description']);
}

function edit_previous_job(jobid){
    window.location.assign(clippy_url + jobid);
}

function addData(context,restoration){    
    if (restoration === undefined){
            restoration = false;
        }

    if(context === undefined){
        context=prepareContext();
    }

    if(context.startTime===context.endTime){
        notifier('Error','Clip has no duration','error');
        return;
    }

    clip_list.push(context);
    scroll_value[1]=context.stopScroll;
    scroll_value[0]=context.startScroll;
    $('#clipDataTable').append(Handlebars.compile($("#cut_clip_template").html())(context));
    $('#clippy_mobile_view').append(Handlebars.compile($("#cut_clip_mobile").html())(context));
    drawSlider('#slider_'+context.rowID);
    drawSlider('#mob_slider_'+context.rowID);

    $('#cut_duration').html('Total Cut Duration  '+ durationToTime(cut_duration += timeToSeconds($('#duration').html())));
    
    $('#form_static_data').attr('style','display:block;')

    if(restoration){
        notifier('Info','A clip has been restored','info');
    }else{
        notifier('Info','Clipped data added in form','info');
    }    

    rowId++;
    localStorage.clear()
    if(!jobid){
        localStorage.setItem('rowData', JSON.stringify(clip_list));
        localStorage.setItem('clippy_tableDataRow', JSON.stringify(clippy_tableDataRow));
    }
}


function ToggleState(){
   $("#left-pannel").toggle();
    if(leftPannelVisible){
        leftPannelVisible=false;
        $('#right-pannel').removeClass('col-md-7 col-sm-12 col-xs-12 table-responsive');
        $('#right-pannel').addClass('col-sm-12 table-responsive');
        $("#right-pannel").css("border-left", "0px");
    }
    else{
        leftPannelVisible= true;
        $('#right-pannel').removeClass('col-sm-12 table-responsive');
        $('#right-pannel').addClass('col-md-7 col-sm-12 col-xs-12 table-responsive');
        $("#right-pannel").css("border-left", "1px");
    }
}

function LoadShows(channelId, channel_show){
    $.ajax({
        type: "GET",
        url: channel_url + channelId,
        contentType: 'json',
        success: function(data) {
            $('#channel_show').children().remove();
            $('<option>').val('-1').text('Select show').appendTo('#channel_show');
            showsjson = $.parseJSON(data);
            var abc = $(showsjson).map(function () {
                return $('<option>').val(this.id).text(this.name);
            });
            $(abc).each(function(){
                this.appendTo('#channel_show');
            });
            if(channel_show!='undefined' && jobid){
                $('#channel_show').val(channel_show)
            }
        },
        error: function(data)
        {
            notifier('Error',"Couldn't find the user's shows",'error');
        }
    });
}

function durationFormatter(value, row, index) {
    return  [(new Date(value * 1000)).toUTCString().match(/(\d\d:\d\d:\d\d)/)[0]].join('');
}

function progressFormatter(value, row, index) {
    return  ['<div class="progress progress-striped" style="margin-bottom:0px;">' +
        '<div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="'+value+'" aria-valuemin="0" aria-valuemax="100" style="width:'+value+'%">' +
            '<span><font color="black">'+value+'% Complete (success)<font></span>' +
        '</div>' +
    '</div>'].join('');
}

function statusFormatter(value, row, index) {
    if(!jobid){
        return String.format('<button row-id="{0}" type="button" class="btn btn-warning btn-xs" onClick=toggleStatus({1},"{2}")>{3}</button>', index, row.id, row.status, row.status);
    }
    else{
        return String.format('<button row-id="{0}" type="button" class="btn btn-warning btn-xs" style="pointer-events:none;" disabled="true" onClick=toggleStatus({1},"{2}")>{3}</button>', index, row.id, row.status, row.status);   
    }
}

function videoFormatter(value, row, index) {
    return String.format('<a row-id="{0}" class="fa fa-play-circle btn btn-success btn-xs" href="'+video_url+'?content_id={1}"></a>', index, row.id);
}

function dateTimeFormatter(value, row, index) {
    return String.format('<span row-id="{0}">{1}<br>{2}</span>', index, row.date, row.time);
}

function processPercentageFormatter(value, row, index) {
    return String.format('<span row-id="{0}">'+value+'%</span>', index);
}

function queryParams(params) {
    $.extend(params, {
        channel_id: $("#clippy_channel_value option:selected").val(),
        status: $("#clippy_status_value option:selected").val(),
        job:jobid
    });
    return params;
};

function refresh_clip_list(){
    localStorage.removeItem('rowData');
    localStorage.setItem('rowData', JSON.stringify(clip_list));
}

function loadSelectedFile(row){
    $( "#slider" ).slider({
    value:scroll_value,
    min:0,
    step:1,
    max: row.duration-1,
rule: makeRulerValues(row.duration-1),
    formater: function(ui){
        return durationToTime(ui);}
    });
    $slider = $('#slider');
    $slider.data('slider').max = row.duration-1;
    $slider.slider('setValue', scroll_value);

    initializeTags(row.id, row.channel_name + ',' + row.date + ',' + row.time, row.duration-1);

    $('#slider').on('slide',function(slideEvt){
        detectChangedIndex(slideEvt.value);
        refreshUI(false);
    });
    $("#slider").on('slideStart', function(slideEvt){
        detectChangedIndex(slideEvt.value);
    });
    $("#slider").on('slideStop', function(slideEvt){
        scroll_value[0] = slideEvt.value[0];
        scroll_value[1] = slideEvt.value[1];
        refreshUI(true);
    });
    sessionStorage.setItem("rowSelected", parseInt(row.rid)+1); //  sessionStorage do google
}

function load_clippy_row(row, row_job){
    if(current_channel!=row.channel_name){
        clearForm();
        current_channel=row.channel_name
    }

    if(!buttonToggle) {
        $('#cut_clip').css( 'pointer-events', 'auto' );
        $(this).addClass('success').siblings().removeClass('success');
        loadSelectedFile(row);
        ToggleState();
        if(row_job){
            LoadShows(row.channel_id, row_job.channel_show);
            load_previous_job(row, row_job);
            clippy_tableDataRow=row;
            $('#jobid').val(row_job);
        }
        else{
            LoadShows(row.channel_id);
        }
    }
    else {
        buttonToggle = false;
    }
}

function move_row(self, selectedID, orientation){
    
    if(orientation==="up"){
        
        current_row = $("#row_" + selectedID); //$(self).closest('tr');
        current_row_index= Math.floor(current_row.index()/2);
        current_slider = current_row.next();
        target_slider = current_row.prev();
        target_row = target_slider.prev();

        if(target_slider.prev().length==0){
            return;
        }
        clip_list.move(current_row_index, current_row_index-1);
        current_row.insertBefore(target_row);
        current_slider.insertAfter(current_row);
        current_mobRow = $("#mobRow_"+selectedID);
        target_mobRow = current_mobRow.prev();
        current_mobRow.insertBefore(target_mobRow);
        
     }
    else{
        current_row = $("#row_" + selectedID);
        current_row_index= Math.floor(current_row.index()/2);
        current_slider = current_row.next();
        target_row = current_slider.next();
        target_slider = target_row.next();

        if(target_row.length==0){
            return;
        }
        clip_list.move(current_row_index, current_row_index+1)
        current_row.insertAfter(target_slider);
        current_slider.insertAfter(current_row);
        current_mobRow = $("#mobRow_"+selectedID);
        target_mobRow = current_mobRow.next();
        current_mobRow.insertAfter(target_mobRow);
    }
    
    refresh_clip_list();
}

function deleteRow(self, rid){
    current_row = $("#row_" + rid);
    current_row_index= Math.floor(current_row.index()/2);
    clip_list.splice(current_row_index,1);
    
    $('#cut_duration').html('Total Cut Duration  '+ durationToTime(cut_duration -= timeToSeconds($($(current_row).find('td')[3]).html())));
    current_row.next().remove();
    current_row.remove();
    $('#mobRow_'+rid).remove();
    localStorage.clear();
    localStorage.setItem('rowData', JSON.stringify(clip_list));
    localStorage.setItem('clippy_tableDataRow', JSON.stringify(clippy_tableDataRow));
    if($('.clip_row').length === 0 ){
        $('#form_static_data').attr('style','display:none;');
        localStorage.clear();
    }
}

function clearForm(){
    $("#channel_show").val(-1);
    $('#title').val('');
    $('#tags').val('');
    $('#description').val('');
    var i=0
    $('.clip_row').each(function (i, row) {
        deleteRow(row, i);
        i++;
    });
    rowId=0;
    localStorage.clear();
}

$(document).ready(function(){

    $('#archive_modal').on('shown.bs.modal', function() {
        init_('archive', {'fname': contentFile});
    })

    $('#archive_modal').on('hide.bs.modal', function (e) {
        $('#archive_iframe').remove();
    });

    $("#clippy_channel_value").change(function() {
        $('#clippy_tableData').bootstrapTable('removeAll');
        $('#clippy_tableData').bootstrapTable('refresh');
        $('#clippy_tableData').bootstrapTable('selectPage', 1);
    });

    $("#clippy_status_value").change(function(){
        $('#clippy_tableData').bootstrapTable('removeAll');
        $('#clippy_tableData').bootstrapTable('refresh');
        $('#clippy_tableData').bootstrapTable('selectPage', 1);
    });

    $('#clippy_tableData').bootstrapTable({
        onClickRow: function (row, $element) {
            clippy_tableDataRow=row
            contentFile=row.content_filename;
            load_clippy_row(row);
            if(!$('#play_archive').length && contentId){
                $('#nameDisplay').append('<span id="play_archive" data-toggle="modal" data-target="#archive_modal" class="fa fa-play-circle-o fa-1x hidden-xs" style="padding-left: 10px; color: #006687;"></span>');
                $('#mob_play_archive').append('<button id="play_archive" data-toggle="modal" data-target="#archive_modal" class="btn btn-primary button-xs text-center">'+
                                                    'Play Archive '+
                                                  '<i class="fa fa-play-circle-o fa-lg"></i>'+
                                                '</button>');
            }
            $('#tbl_jobs').children().length>1 ? $('#tbl_jobs').bootstrapTable('load',{data: row.jobs}) : $('#tbl_jobs').bootstrapTable({data: row.jobs});
            $('div[id|="jobs"]').remove();
        },
        onLoadSuccess: function(){
            if(jobid){
                $('#clippy_channel_value').hide()
                $('#clippy_status_value').hide()
                var row_data = $('#clippy_tableData').bootstrapTable('getData')[0];
                if(!row_data)
                {
                    notifier('Error','The content of the job is no longer available','error');
                    return;
                }
                contentFile = $('#clippy_tableData').bootstrapTable('getData')[0].content_filename
                var row_job;
                for(var i=0;i<row_data['jobs'].length;i++){
                    if(jobid===row_data['jobs'][i]['job_pk']){
                        row_job = $('#clippy_tableData').bootstrapTable('getData')[0]['jobs'][i];
                        break;
                    }
                }
                localStorage.clear();
                $('div[id|="jobs"]').remove();
                load_clippy_row(row_data,row_job);
                if(!$('#play_archive').length && contentId){
                    $('#nameDisplay').append('<span id="play_archive" data-toggle="modal" data-target="#archive_modal" class="fa fa-play-circle-o fa-1x hidden-xs" style="padding-left: 10px; color: #006687;"></span>') 
                        $('#mob_play_archive').append('<button id="play_archive" data-toggle="modal" data-target="#archive_modal" class="btn btn-primary button-xs text-center">'+
                                                    'Play Archive '+
                                                  '<i class="fa fa-play-circle-o fa-lg"></i>'+
                                                '</button>');
                }
                $('#jobid').val(jobid);
                scroll_value=[0,240];
            }
        }
    });

    $('#start_tag').click(function () {
        if(contentId){
            window.open(
              $('#start_tag').attr('src').replace('160x90','620x480'),
              '_blank' 
            );    
        }
    });

    $('#stop_tag').click(function () {
        if(contentId){
            window.open(
              $('#stop_tag').attr('src').replace('160x90','620x480'),
              '_blank' 
            );    
        }       
    });


    if(!jobid){
        if(localStorage.getItem('rowData')!=null ){
            var rows = JSON.parse(localStorage.getItem('rowData'));
            clippy_tableDataRow = JSON.parse(localStorage.getItem('clippy_tableDataRow'));
            localStorage.clear();
            for (var i=0;i<rows.length;i++)
            {
                if(rows[i]['clip_id']!=0) 
                {
                    return;
                }
            }

            if(confirm("Do you wish to restore the previous session?"))
            {
                load_clippy_row(clippy_tableDataRow)
                for(var i=0;i<rows.length;i++){
                    var context=prepareContext(rows[i])
                    if(context.rowID>=rowId)
                    {
                        rowId=context.rowID+1
                    }
                    addData(context,true);
                }
            }    
        }
    }    
    
    scroll_value[0,240]
});
