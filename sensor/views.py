# Create your views here.

from django.http import HttpResponse
import json
import requests
import dateutil.parser
from datetime import datetime as dt
from django.shortcuts import render_to_response

from sensor import constant


def index(request):
    if request.GET:
        id1 = request.GET.get('id1', '')
        id2 = request.GET.get('id2', '')
        id3 = request.GET.get('id3', '')

        date = dt.strptime(request.GET['date'], constant.date_format)
        end = date.isoformat() + 'Z'
        url = constant.API_URL.format(id1, constant.API_KEY, constant.series, constant.utc_offset, end)
        req = requests.get(url)

        x_axis_list = []
        y_axis_list = []
        if req.status_code:
            # print req.url
            data_ = json.loads(req.content)
            obj_datetime = dateutil.parser.parse(data_['data'][0]['ts'])
            day = obj_datetime.day
            month = obj_datetime.month
            year = obj_datetime.year
            # print obj_datetime
            for data in data_['data']:
                obj_datetime = dateutil.parser.parse(data['ts'])
                pm25_value = data['data']['pm25']
                x_axis_list.append(obj_datetime)
                y_axis_list.append(pm25_value)

        return render_to_response('graph.html', {
            'x_values': x_axis_list,
            'y_values': y_axis_list,
            'day': day,
            'month': month,
            'year': year

        })

    else:
        return render_to_response('content.html', {
            'cities': [],
            'name': 'Abrar'
        })
