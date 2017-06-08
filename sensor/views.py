# Create your views here.

from django.http import HttpResponse
import json
import requests
import dateutil.parser
from datetime import datetime as dt
from django.shortcuts import render_to_response
from sensor import constant
import pymysql
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.conf import settings


@ensure_csrf_cookie
def index(request):
    if request.POST:
        id1 = request.POST.get('id1', '')
        id2 = request.POST.get('id2', '')
        id3 = request.POST.get('id3', '')
        id4 = request.POST.get('id4', '')

        resp1 = procces_values(request, id1)
        resp2 = procces_values(request, id2)
        resp3 = procces_values(request, id3)
        resp4 = procces_values(request, id4)

        return render_to_response('graph.html', {
            'x_values_1': resp1.get('x_axis_list',[]),
            'y_values_1': resp1.get('y_axis_list',[]),
            'x_values_2': resp2.get('x_axis_list',[]),
            'y_values_2': resp2.get('y_axis_list',[]),
            'x_values_3': resp3.get('x_axis_list',[]),
            'y_values_3': resp3.get('y_axis_list',[]),
            'x_values_4': resp4.get('x_axis_list',[]),
            'y_values_4': resp4.get('y_axis_list',[]),
            'start_day': resp2['start_day'],
            'start_month': resp2['start_month'],
            'start_year': resp2['start_year'],
            'end_day': resp2['end_day'],
            'end_month': resp2['end_month'],
            'end_year': resp2['end_year'],
            'id1'   : id1 ,
            'id2'   : id2 ,
            'id3'   : id3 ,
            'id4'   : id4 ,

        })

    else:
        return render(request, 'content.html', {
            'cities': [],
            'name': 'Abrar'
        })


def procces_values(request, id):
    response_dict = {}
    start_date = dt.strptime(request.POST['start_date'], constant.date_format)
    end_date = dt.strptime(request.POST['end_date'], constant.date_format)
    end = end_date.isoformat() + 'Z'
    begin = start_date.isoformat() + 'Z'
    url = constant.API_URL.format(id, constant.API_KEY, constant.series, constant.utc_offset, begin, end)
    req = requests.get(url)
    ee = dateutil.parser.parse(end)
    nn = dateutil.parser.parse(begin)

    x_axis_list = []
    y_axis_list = []
    if req.status_code == 200:
        data_ = json.loads(req.content.decode('utf-8'))
        obj_datetime = dateutil.parser.parse(data_['data'][0]['ts'])
        # day = obj_datetime.day
        # month = obj_datetime.month
        # year = obj_datetime.year
        for data in data_['data']:
            obj_datetime = dateutil.parser.parse(data['ts'])
            pm25_value = data['data']['pm25']
            x_axis_list.append(obj_datetime)
            y_axis_list.append(pm25_value)

        response_dict['x_axis_list'] = x_axis_list
        response_dict['y_axis_list'] = y_axis_list

    response_dict['start_day'] = nn.day
    response_dict['start_month'] = nn.month
    response_dict['start_year'] = nn.year
    response_dict['end_day'] = ee.day
    response_dict['end_month'] = ee.month
    response_dict['end_year'] = ee.year

    return response_dict


def test(mac_id):
    conn = pymysql.connect(
        host=settings.DATA_BASE_HOST,
        user=settings.DATA_BASE_USER,
        passwd=settings.DATA_BASE_PASSWORD,
        db=settings.DATA_BASE_NAME,
        port=settings.DATA_BASE_PORT
    )
    rows = None
    try:
        cursor = conn.cursor()
        cursor.execute("select * from laseregg where mac like %s "%("'%"+mac_id+"'"))
        rows = cursor.fetchall()

    finally:
        conn.close()
    return rows


@csrf_exempt
def fetchmac(request):
    try:
        mac_id = request.POST.get('mac_id')
        to_return = {}
        time_ids_list = []
        db_result = test(mac_id)
        if db_result:
            for i in db_result:
                time_ids_list.append(
                    {"value": "%s,%s" % (str(i[20]), str(i[8])), "text": "%s | %s" % (str(i[1][-4:]), str(i[8]))})
                to_return['options'] = time_ids_list
            return HttpResponse(json.dumps(to_return), content_type="application/json")
        else:
            to_return['options'] = None
            return HttpResponse(json.dumps(to_return), content_type="application/json")


    except Exception as e:
        pass




@csrf_exempt
def get_latest_reading(request):
    to_return = {}
    if request.POST:
        try:
            time_id = request.POST.get('time_id')
            url = constant.API_LATEST_READING.format(time_id, constant.API_KEY)
            req = requests.get(url)
            reqq = json.loads(req.content)
            if req.status_code == 200:
                data = reqq['info.aqi']['data']['pm25']

            to_return['data'] = data
        except Exception as e:
            pass

    return HttpResponse(json.dumps(to_return), content_type="application/json")
