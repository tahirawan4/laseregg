from django.conf.urls import patterns, url

from sensor import views

urlpatterns = patterns('',

    url(r'^get_latest_reading/$', views.get_latest_reading, name='get_latest_reading'),
    url(r'^fetchmac/$', views.fetchmac, name='fetchmac'),
    url(r'^$', views.index, name='index'),



)
