from django.http import HttpResponseNotFound, Http404, HttpResponse
from django.shortcuts import get_object_or_404

def render_template(view_func):
	from django.shortcuts import render_to_response
	from django.template import RequestContext
	from django.http import HttpResponse

	def decorate(request, *args, **kwargs):
		ret_data = view_func(request, *args, **kwargs)
		if isinstance(ret_data, HttpResponse):
			return ret_data

		template_name, context = ret_data
		return render_to_response(template_name, context,
			context_instance=RequestContext(request))

	return decorate


