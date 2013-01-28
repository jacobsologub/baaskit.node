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

var libassert = require ('assert');
var libexpress = require ('express');
var libcommander = require ('commander');

//==============================================================================
/** BaaSKitServer class
	A simple wrapper class around the all 'express' lib and route 
	initialization.
*/
var BaaSKitServer = (function () {

	//==============================================================================
	/** Creates a BaaSKitServer object. */
    function BaaSKitServer()
    {
    	expressApp = libexpress();

		expressApp.configure (function() {
			expressApp.set ('title', 'baaskit');
			expressApp.disable ('x-powered-by');
			expressApp.use (libexpress.bodyParser());
		});

		var baasKitAdmin = require ('./routes/admin');
		expressApp.post ('/applications/:applicationName', baasKitAdmin.createApp);
		expressApp.post ('/applications/:applicationId/clientkey', baasKitAdmin.generateAppClientKey);
		expressApp.get ('/applications/:applicationId', baasKitAdmin.getApp);
		expressApp.get ('/applications', baasKitAdmin.getAllApps);
		expressApp.delete ('/applications/:applicationId', baasKitAdmin.deleteApp);

		var baasKitData = require ('./routes/data');
		expressApp.post ('/collections/:collectionName', baasKitData.post);
		expressApp.get ('/collections/:collectionName/:objectId', baasKitData.get);
		expressApp.get ('/collections/:collectionName', baasKitData.get);
		expressApp.put ('/collections/:collectionName/:objectId', baasKitData.put);
		expressApp.put ('/collections/:collectionName', baasKitData.put);
		expressApp.delete ('/collections/:collectionName/:objectId', baasKitData.delete);
		expressApp.delete ('/collections/:collectionName', baasKitData.delete);
    }

    BaaSKitServer.prototype.start = function (port) {

        expressApp.listen (port);
    }

    var expressApp = null;
    return BaaSKitServer;
})();

//==============================================================================
function main()
{
	libcommander
		.version ('0.0.1')
		.option ('-p, --port <port>', 'specify the port [3000]', Number, 3000)
		.option ('-c, --createapp <application name>', 'create a new application')
		.option ('-d, --deleteapp <application id>', 'delete an application')
		.option ('-l, --listapps', 'list all applications')
		.option ('-g, --generateclientkey <application id>', 'generate a new application client key')
		.parse (process.argv);

	if (libcommander.createapp || libcommander.deleteapp || libcommander.listapps || libcommander.generateclientkey)
	{
		var admin = require ('./admin');
		var baasKitAdmin = new admin.BaaSKitAdmin (true);

		if (libcommander.createapp && libcommander.createapp.length)
		{
			baasKitAdmin.createApplication (libcommander.createapp, function (error, newApplication) {

				console.log (!error ? newApplication : error ['message']);
				process.exit (error);
			});
		}
		else if (libcommander.deleteapp && libcommander.deleteapp.length)
		{
			baasKitAdmin.deleteApplication (libcommander.deleteapp, function (error) {

				console.log (!error ? "Application deleted successfully." : error ['message']);
				process.exit (error);
			});
		}
		else if (libcommander.listapps)
		{
			baasKitAdmin.listAllApplications (function (error, applicationList) {

				console.log (!error ? applicationList : error ['message']);
				process.exit (error);
			});
		}
		else if (libcommander.generateclientkey && libcommander.generateclientkey.length)
		{
			baasKitAdmin.generateApplicationClientKey (libcommander.generateclientkey, function (error) {

				console.log (!error ? "Application client key generated successfully." : error ['message']);
				process.exit (error);
			});
		}
		else
		{
			process.exit (0);
		}
	}
	else 
	{
		var server = new BaaSKitServer();
		server.start (libcommander.port);
	}
}

main();