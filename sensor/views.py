# Create your views here.

from django.http import HttpResponse
import json
import requests
import dateutil.parser
from datetime import datetime as dt, timedelta

from django.shortcuts import render_to_response
from sensor import constant
import pymysql
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.conf import settings


@ensure_csrf_cookie
def index(request):
    ids={
        'id1':None,
        'id2':None,
        'id3':None,
        'id4':None
    }
    if request.POST:
        ids['id1'] = request.POST.get('id1', '')
        ids['id2'] = request.POST.get('id2', '')
        ids['id3'] = request.POST.get('id3', '')
        ids['id4'] = request.POST.get('id4', '')

        start_date = dt.strptime(request.POST['start_date'], constant.date_format)
        end_date = dt.strptime(request.POST['end_date'], constant.date_format) + timedelta(hours=24)
        end = end_date.isoformat() + 'Z'
        begin = start_date.isoformat() + 'Z'
        ee = dateutil.parser.parse(end)
        nn = dateutil.parser.parse(begin)

        delta = end_date - start_date
        if delta.days>10:
            return HttpResponse(json.dumps({"Error":"Please Select maximum 10 days limit"}), content_type="application/json")
        days = delta.days * 2

        resp = {
            'resp1' : {'x_axis_list':[],'y_axis_list':[]},
            'resp2' : {'x_axis_list':[],'y_axis_list':[]},
            'resp3' : {'x_axis_list':[],'y_axis_list':[]},
            'resp4' : {'x_axis_list':[],'y_axis_list':[]}
        }

        for x in range(4):
            for i in range(days):
                start = start_date + timedelta(hours=12*i)
                end = start_date + timedelta(hours=12*(i+1))
                date_response = procces_values(request, ids['id'+str(x+1)], start, end)
                x_list = resp['resp'+str((x+1))]['x_axis_list']
                y_list = resp['resp'+str((x+1))]['y_axis_list']
                x_list = x_list + date_response['x_axis_list']
                y_list = y_list + date_response['y_axis_list']
                resp['resp'+str((x+1))].update({'x_axis_list':x_list})
                resp['resp'+str((x+1))].update({'y_axis_list':y_list})


        return render_to_response('graph.html', {
            'x_values_1': resp['resp1'].get('x_axis_list',[]),
            'y_values_1': resp['resp1'].get('y_axis_list',[]),
            'x_values_2': resp['resp2'].get('x_axis_list',[]),
            'y_values_2': resp['resp2'].get('y_axis_list',[]),
            'x_values_3': resp['resp3'].get('x_axis_list',[]),
            'y_values_3': resp['resp3'].get('y_axis_list',[]),
            'x_values_4': resp['resp4'].get('x_axis_list',[]),
            'y_values_4': resp['resp4'].get('y_axis_list',[]),
            'start_day': nn.day,
            'start_month': nn.month-1,
            'start_year': nn.year,
            'end_day': ee.day,
            'end_month': ee.month,
            'end_year': ee.year,
            'id1'   : ids['id1'] ,
            'id2'   : ids['id2'] ,
            'id3'   : ids['id3'] ,
            'id4'   : ids['id4'] ,

        })

    else:
        return render(request, 'content.html', {
            'cities': [],
            'name': 'Abrar'
        })


def procces_values(request, id, start_date, end_date):
    response_dict = {}

    end = end_date.isoformat() + 'Z'
    begin = start_date.isoformat() + 'Z'

    url = constant.API_URL.format(id, constant.API_KEY, constant.series, constant.utc_offset, begin,end)
    req = requests.get(url)
    ee = dateutil.parser.parse(end)
    nn = dateutil.parser.parse(begin)

    x_axis_list = []
    y_axis_list = []
    if req.status_code == 200:
        data_ = json.loads(req.content.decode('utf-8'))
        obj_datetime = dateutil.parser.parse(data_['data'][0]['ts'])
        for data in data_['data']:
            obj_datetime = dateutil.parser.parse(data['ts'])
            pm25_value = data['data']['pm25']
            x_axis_list.append(obj_datetime)
            y_axis_list.append(pm25_value)

        response_dict['x_axis_list'] = x_axis_list
        response_dict['y_axis_list'] = y_axis_list

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
