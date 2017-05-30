from django.conf.urls import patterns, url

from sensor import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),


)
