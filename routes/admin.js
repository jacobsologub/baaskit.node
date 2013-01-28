/*
  ==============================================================================
 
   Copyright (C) 2013 Jacob Sologub

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to
   deal in the Software without restriction, including without limitation the
   rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
   sell copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
   FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
   IN THE SOFTWARE.
 
  ==============================================================================
*/

var baaskitadmin = require ('../baaskitadmin');
var kBaaSKitAdmin = new baaskitadmin.BaaSKitAdmin();

//==============================================================================
/** Creates an application with a specified name if an app with the specified 
	name does not exists.

	@see deleteApp
*/
exports.createApp = function (request, response) {

	if (request.host != 'localhost')
		response.send (403);

	kBaaSKitAdmin.createApplication (request.params.applicationName, function (error, newApplication) {

		if (!error)
		{
			response.send (201, newApplication['id']);
		}
		else
		{
			response.send (500, error ['message']);
		}
	});
};

/** Gets an application with a specified Id. 
	@see getAllApps
*/
exports.getApp = function (request, response) {

	if (request.host != 'localhost')
		response.send (403);

	kBaaSKitAdmin.getApplication (request.params.applicationId, function (error, application) {

		if (!error)
		{
			response.send (200, application);
		}
		else
		{
			response.send (500, error ['message']);
		}
	});
};

/** Gets a list of all applications.
	@see getApp
*/
exports.getAllApps = function (request, response) {

	if (request.host != 'localhost')
		response.send (403);

	kBaaSKitAdmin.listAllApplications (function (error, applicationList) {

		if (!error)
		{
			response.send (200, applicationList);
		}
		else
		{
			response.send (500, error ['message']);
		}
	});
};

/** Deletes an application with a specified Id. 
	@see createApp
*/
exports.deleteApp = function (request, response) {

	if (request.host != 'localhost')
		response.send (403);

	kBaaSKitAdmin.deleteApplication (request.params.applicationId, function (error) {

		if (!error)
		{
			response.send (200);
		}
		else
		{
			response.send (500, error ['message']);
		}
	});
};

/** Updates the clientKey of an application with a specified Id.
	@see createApp
*/
exports.generateAppClientKey = function (request, response) {

	if (request.host != 'localhost')
		response.send (403);

	kBaaSKitAdmin.generateApplicationClientKey (request.params.applicationId, function (error) {

		if (!error)
		{
			response.send (200);
		}
		else
		{
			response.send (500, error ['message']);
		}
	});
};