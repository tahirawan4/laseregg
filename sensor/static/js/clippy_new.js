var form_data = [];
var showsjson = "";
var fileName= "";
var scroll_value=[45,240];
var index=-1;
var leftPannelVisible = true;

var streamName="";
var streamId="";
var streamDuration="";
var rowId=1;
var context;
var clip_list = {};
rowID_list = [];
var clippy_tableDataRow;

var colors=['#C0C0C0','#0099FF','#33FFFF','#6699FF','#99FFFF','#CC99FF','#FFCCFF','#FFFFCC','#CCFF99','#99FF99'];
var cIndex=0;
var buttonToggle=false;

var prevSelectedFile = -1;

var cut_duration = 0;
var row_count = 0;

var status_url;
var channel_url;
var video_url;
var activity_log_url;
var filePath= "";


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
    $("#nameDisplay").html(streamName);
}

function initializeTags(id,sName,sDuration){
    streamName= sName;
    streamId = id;
    streamDuration = sDuration;
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
        var image_name= fileName+ imageIndex + ".jpg";
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
        show_rowid 	= $(ev.target.selectedOptions).val();
        showObj 	= showsjson[show_rowid];
        $('#title').val(getTitle());
        $('#description').val(showObj['desc']);
        $('#tags').val(showObj['tags']);
        return false;
    });

    $( "#clippedForm" ).submit(function( event ) {
        if($('#air_date').val() == '') {
            alert('Please enter an air date');
            event.preventDefault();
        }

        else if($('#channel_show').val() === '-1') {
            alert('Select valid show');
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
            localStorage.setItem('channel', clippy_tableDataRow['channel_id']);
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
    streamDuration = streamDuration-1
    $( name ).slider({
        value:scroll_value,
        min:0,
        step:1,
        max: streamDuration,
        enabled:false,
        rule:'',
        tooltip:'always',
        formater: function(ui) {
            return durationToTime(ui);
        },
        selectionColor:  'style="background:'+colors[(rowId+2)%10]+'"'
    });
}

function prepareContext(){
    
    context = {
        name :      streamName,
        streamID : streamId,
        startTime : getStartTime(),
        endTime:    getEndTime(),
        duration :  $('#duration').html(),
        startClip:  $('#start_tag').attr('src'),
        endClip :   $('#stop_tag').attr('src'),
        rowID :     rowId,
        startScroll : scroll_value[0],
        stopScroll : scroll_value[1] 
    };
    
    return context;
}

function addData(context,restoration){
    
    if (restoration === undefined){
        restoration = false;
    }

    if(context === undefined){
        context=prepareContext();
    }


    rowID_list.push(context.rowID);
    clip_list[context.rowID] = context;
    

    $('#clipDataTable').append(Handlebars.compile($("#cut_clip_template").html())(context));
    $('#clippy_mobile_view').append(Handlebars.compile($("#cut_clip_mobile").html())(context));

    scroll_value[0]=context.startScroll;
    scroll_value[1]=context.stopScroll;
    drawSlider('#slider_'+context.rowID)
    drawSlider('#mob_slider_'+context.rowID)

    $('#cut_duration').html('Total Cut Duration  '+ durationToTime(cut_duration += timeToSeconds($('#duration').html())));
    
    $('#form_static_data').attr('style','display:block;')



    if(restoration){
        notifier('Info','A clip has been restored','info');
    }else{
        notifier('Info','Clipped data added in form','info');
    }    
    ++row_count;
    ++rowId;
    localStorage.clear()
    localStorage.setItem('rowData', JSON.stringify(clip_list));
    localStorage.setItem('clippy_tableDataRow', JSON.stringify(clippy_tableDataRow));
}

function deleteRow(rid){
    rowID_list.splice(rowID_list.indexOf(rid),1);
    $('#cut_duration').html('Total Cut Duration  '+ durationToTime(cut_duration -= timeToSeconds($($('#row_'+rid+' td')[3]).html())));
    if(!(--row_count)){
        rowId=1;
        $('#form_static_data').attr('style','display:none;');
    }
    
    delete clip_list[rid];
    $('#row_'+rid).remove();
    $('#s_'+rid).remove();
    $('#mobRow_'+rid).remove();
    // $('#clip_list').attr('value', JSON.stringify(clip_list);
    $('#clip_list').val(JSON.stringify(clip_list));
    localStorage.clear();
    if(row_count){
        localStorage.setItem('rowData', JSON.stringify(clip_list));
        localStorage.setItem('clippy_tableDataRow', JSON.stringify(clippy_tableDataRow));
    }
}

function clearForm(){
    $("#channel_show").val(-1);
    $('#title').val('');
    $('#tags').val('');
    $('#description').val('');
}

function ToggleState(){
   $("#left-pannel").toggle();
    if(leftPannelVisible){
        leftPannelVisible=false;
        $('#right-pannel').removeClass('col-md-7 col-sm-12 col-xs-12 table-responsive');
        $('#right-pannel').addClass('col-sm-12 table-responsive');
    }
    else{
        leftPannelVisible= true;
        $('#right-pannel').removeClass('col-sm-12 table-responsive');
        $('#right-pannel').addClass('col-md-7 col-sm-12 col-xs-12 table-responsive');
    }
}
function LoadShows(channelId){
    $('#title').val(''); // use .val('')
    $('#description').val('');
    $('#tags').val('');
    $('#channel_show').val('');
    while(rowID_list.length!=0){
        deleteRow(rowID_list[rowID_list.length-1]);
    }
    $.ajax({
        type: "GET",
        url: channel_url + channelId,
        contentType: 'json',
        success: function(data) {
            $('#channel_show').children().remove();
            $('<option>').val('-1').text('Select show').appendTo('#channel_show');
            showsjson = $.parseJSON(data);
            var abc = $(showsjson).map(function (val, i) {
                return $('<option>').val(val).text(this.name);
            });
            $(abc).each(function(){
                this.appendTo('#channel_show');
            });
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
    return String.format('<button row-id="{0}" type="button" class="btn btn-warning btn-xs" onClick=toggleStatus({1},"{2}")>{3}</button>', index, row.id, row.status, row.status);
}

function videoFormatter(value, row, index) {
    return String.format('<a row-id="{0}" class="fa fa-play-circle btn btn-success btn-xs" href="'+video_url+'?content_id={1}"></a>', index, row.id);
}

function LogFormatter(value, row, index) {
    return String.format('<span row-id="{0}" type="button" class="fa fa-database btn btn-danger btn-xs" ></span>', index, row.id, row.status, row.status);
}

function dateTimeFormatter(value, row, index) {
    return String.format('<span row-id="{0}">{1}<br>{2}</span>', index, row.date, row.time);
}

function processPercentageFormatter(value, row, index) {
    return String.format('<span row-id="{0}">'+value+'%</span>', index);
}

function optionsFormatter(value, row, index) {
    return String.format("<div class='btn-group' role='group'>" +
            "<a row-id='{0}' type='button' style='width:30px'; class='fa fa-database btn btn-danger btn-xs' ></a>" +
            "<a row-id='{0}' class='fa fa-play-circle btn btn-success btn-xs' style='width:30px; margin-left:0px;' href='"+video_url+"?content_id={1}'></a>" +
            "<a row-id='{0}' type='button' class='btn btn-warning btn-xs' style='width:60px; margin-left:0px;'>{3}</a>" +
         "</div>", index, row.id, row.status, row.status);
}

function queryParams(params) {
    $.extend(params, {
        channel_id: $("#clippy_channel_value option:selected").val(),
        status: $("#clippy_status_value option:selected").val()
    });
    return params;
};

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

$(function(){

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

        onPostBody:function() {
            $('.fa-database').popover({
                'trigger': 		'hover',
                'placement':	'left',
                'html':			true,
                'title': 'Clips Logs',
                'content':	function() {
                    var popover = $(this).data('bs.popover');
                    var id = $(this).attr('row-id');
                    var row = $('#clippy_tableData').bootstrapTable('getData')[id];
                    $.ajax({
                        type: 	 "GET",
                        url: 	 String.format(activity_log_url, row.id),
                        success: function(data) {
                            popover.options.content = data;
                            popover.show();
                        },
                        error: function(data) {
                            'Unable to load data';
                        }
                    });
                    return '<i class="fa fa-spinner fa-spin"></i>';
                }
            });
        },
        onClickRow: function (row) {
           load_clippy_row(row)
        }
    });
    
});

function load_clippy_row(row){
    if(!buttonToggle) {
        $('#cut_clip').css( 'pointer-events', 'auto' );
        $(this).addClass('success').siblings().removeClass('success');
        loadSelectedFile(row);
        LoadShows(row.channel_id);
        ToggleState();
        clippy_tableDataRow=row;
        clip_list['streamIdentity'] = streamId;
    }
    else {
        buttonToggle = false;
    }
}

function move_row(selectedID,orientation){
    var temp, target, current=rowID_list.indexOf(selectedID); 
    if(orientation==="up"){
        target=rowID_list[current-1]
        if(target===undefined){
            return;
        }
        $("#row_"+selectedID).insertBefore($("#row_"+target));
        $("#s_"+selectedID).insertAfter($("#row_"+selectedID));
        $("#s_"+target).insertAfter($("#row_"+target));
        $("#mobRow_"+selectedID).insertBefore($("#mobRow_"+target));
        temp=rowID_list[current];
        rowID_list[current]=rowID_list[current-1]
        rowID_list[current-1]=temp;
    }
    else{
        target=rowID_list[current+1];
        if(target===undefined){
            return;
        }
        $("#row_"+selectedID).insertAfter($("#row_"+target));
        $("#s_"+selectedID).insertAfter($("#row_"+selectedID));   
        $("#s_"+target).insertAfter($("#row_"+target));
        $("#mobRow_"+selectedID).insertAfter($("#mobRow_"+target));
        temp=rowID_list[current];
        rowID_list[current]=rowID_list[current+1]
        rowID_list[current+1]=temp;
    }
    
    clip_list[target].rowID=[clip_list[selectedID].rowID, clip_list[selectedID].rowID=clip_list[target].rowID][0];
    clip_list[target]=[clip_list[selectedID],clip_list[selectedID]=clip_list[target]][0];
    localStorage.removeItem('rowData');
    localStorage.setItem('rowData', JSON.stringify(clip_list));

}



$(document).ready(function(){


    $('#start_tag').click(function () {
        imgContext = {
            source :     $('#start_tag').attr('src')
        };
        $( "#selected_large_img" ).remove();
        $('#img_container').append(Handlebars.compile($("#high_res_image").html())(imgContext));
        $('#imageModal').modal('toggle');
        $('#imageModal').modal('show');
    });

    $('#stop_tag').click(function () {
        imgContext = {
            source :     $('#stop_tag').attr('src')
        };
        $( "#selected_large_img" ).remove();
        $('#img_container').append(Handlebars.compile($("#high_res_image").html())(imgContext));
        $('#imageModal').modal('toggle');
        $('#imageModal').modal('show');
    });

    if(localStorage.getItem('rowData')!=null){
        if(confirm("Do you wish to restore the previous session?"))
        {
            var rows = JSON.parse(localStorage.getItem('rowData'));
            var tableDataRow = JSON.parse(localStorage.getItem('clippy_tableDataRow'));    
            localStorage.clear();
            load_clippy_row(tableDataRow)
            for(var key in rows){
                if(key==='streamIdentity'){
                    continue;
                }
                var context = {
                    name        : rows[key].name,
                    streamID    : rows[key].streamID,
                    startTime   : rows[key].startTime,
                    endTime     : rows[key].endTime,
                    duration    : rows[key].duration,
                    startClip   : rows[key].startClip,
                    endClip     : rows[key].endClip,
                    rowID       : rows[key].rowID,
                    startScroll : rows[key].startScroll,
                    stopScroll  : rows[key].stopScroll
                };
                if(context.rowID>=rowId)
                {
                    rowId=context.rowID+1
                }
                addData(context,true);
            }
        }
        else{
            localStorage.clear();    
        }
    }    
    if(localStorage.getItem('channel')!=null){
        $('#clippy_channel_value').val(parseInt(localStorage.getItem('channel'))).change();
        localStorage.clear();
    }    
    scroll_value[0]=0;
    scroll_value[1]=240;
});