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

	A simple wrapper class around the 'express' lib and all of the route 
	initialization.
*/
var BaaSKitServer = (function () {

	//==============================================================================
	/** Creates a BaaSKitServer object. */
    function BaaSKitServer()
    {
    	this.expressApp = libexpress();

    	// (set settings for all environments)
		this.expressApp.set ('title', 'baaskit');
		this.expressApp.disable ('x-powered-by');
		this.expressApp.use (libexpress.bodyParser());

		// (applications routes)
		var applications = require ('./routes/applications');
		this.expressApp.post ('/applications/:applicationName', applications.createApp);
		this.expressApp.post ('/applications/:applicationId/clientkey', applications.generateAppClientKey);
		this.expressApp.get ('/applications/:applicationId', applications.getApp);
		this.expressApp.get ('/applications', applications.getAllApps);
		this.expressApp.delete ('/applications/:applicationId', applications.deleteApp);

		// (collections routes)
		var collections = require ('./routes/collections');
		this.expressApp.post ('/collections/:collectionName', collections.post);
		this.expressApp.get ('/collections/:collectionName/:objectId', collections.get);
		this.expressApp.get ('/collections/:collectionName', collections.get);
		this.expressApp.put ('/collections/:collectionName/:objectId', collections.put);
		this.expressApp.put ('/collections/:collectionName', collections.put);
		this.expressApp.delete ('/collections/:collectionName/:objectId', collections.delete);
		this.expressApp.delete ('/collections/:collectionName', collections.delete);
    }

    BaaSKitServer.prototype.start = function (port) {

        this.expressApp.listen (port);
    };

    return BaaSKitServer;
})();

//==============================================================================
/** BaaSKit class
	
	The main class that kicks everything off.
*/
var BaaSKit = (function () {

	//==============================================================================
	/** Creates a BaaSKit object. */
    function BaaSKit() 
    {
    	var packageInfo = require ('./package');
    	var version = packageInfo ['version'];

    	libcommander
			.version (version)
			.option ('-p, --port <port>', 'specify the port [3000]', Number, 3000)
			.option ('-c, --createapp <application name>', 'create a new application')
			.option ('-d, --deleteapp <application id>', 'delete an application')
			.option ('-l, --listapps', 'list all applications')
			.option ('-g, --generateclientkey <application id>', 'generate a new application client key')
			.parse (process.argv);

		if (libcommander.createapp || libcommander.deleteapp || libcommander.listapps || libcommander.generateclientkey)
		{
			var admin = require ('./admin');
			var applications = new admin.BaaSKitAdmin (true);

			if (libcommander.createapp && libcommander.createapp.length)
			{
				applications.createApplication (libcommander.createapp, function (error, newApplication) {

					console.log (!error ? newApplication : error ['message']);
					process.exit (error);
				});
			}
			else if (libcommander.deleteapp && libcommander.deleteapp.length)
			{
				applications.deleteApplication (libcommander.deleteapp, function (error) {

					console.log (!error ? "Application deleted successfully." : error ['message']);
					process.exit (error);
				});
			}
			else if (libcommander.listapps)
			{
				applications.listAllApplications (function (error, applicationList) {

					console.log (!error ? applicationList : error ['message']);
					process.exit (error);
				});
			}
			else if (libcommander.generateclientkey && libcommander.generateclientkey.length)
			{
				applications.generateApplicationClientKey (libcommander.generateclientkey, function (error) {

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

    return BaaSKit;

})();

var baasKit = new BaaSKit();
