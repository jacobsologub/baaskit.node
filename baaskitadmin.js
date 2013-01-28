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
var libcrypto = require ('crypto');
var libmongo = require ('mongodb');

//==============================================================================
var MongoServer = libmongo.Server;
var MongoDatabase = libmongo.Db;
var BSON = libmongo.BSONPure;

var kMongoServer = new MongoServer ('localhost', 27017, { auto_reconnect: true });
var kDatabaseConnection = new MongoDatabase ('baaskitdb', kMongoServer, { w : 0 });

kDatabaseConnection.open (function (error, databse) {
  libassert.equal (null, error, 'Could not connect to mongodb.');
});

//==============================================================================
var BaaSKitAdmin = (function () {

	//==========================================================================
	/** Creates a BaaSKitAdmin object. */
    function BaaSKitAdmin (asksForUserConfirmation_) 
    {
    	asksForUserConfirmation = asksForUserConfirmation_;
    }

    //==========================================================================
    /** Creates an application with a specified name if an application with the 
    	specified name does not exists.

		@see deleteApplication
	*/
    BaaSKitAdmin.prototype.createApplication = function (applicationName, callback) {

    	var colleciton = kDatabaseConnection.collection ('applications');
		colleciton.findOne ({ 'name' : applicationName }, function (error, item) {

			if (item == null)
			{
				var app = {
					
					'name' : applicationName,
					'id' : libcrypto.randomBytes (12).toString ('hex'),
					'clientKey' : libcrypto.randomBytes (12).toString ('hex')
				};

				colleciton.insert (app, function (error, object) {

					if (!error)
					{
						callback (null, object[0]);
					}
					else
					{
						callback ({ 'message' : 'An unknown error occurred.' } , null);
					}
				});
			}
			else
			{
				callback ({ 'message' : 'An application with that name already exists.' } , null);
			}
		});
    };

    /** Deletes an application with a specified Id. 
		@see createApplication
	*/
    BaaSKitAdmin.prototype.deleteApplication = function (applicationId, callback) {

    	var colleciton = kDatabaseConnection.collection ('applications');

		colleciton.findOne ({ 'id' : applicationId }, function (error, item) {

			if (item != null)
			{
				var confirmation = function (ok) {

					if (ok)
					{
						colleciton.remove (item, function (error, num) {

							if (!error)
							{
								callback (null);
							}
							else
							{
								callback ({ 'message' : 'An unknown error occurred.' });
							}
						});
					}
					else
					{
						callback ({ 'message' : 'goodbye' } , null);
					}
				};

				if (this.asksForUserConfirmation)
				{
					libcommander.confirm ('Are you sure you want to delete this application? ', function (ok) {

						confirmation (ok);
					});
				}
				else
				{
					confirmation (true);
				}
			}
			else
			{
				callback ({ 'message' : 'An application with that id does not exist.' });
			}
		});
    };

    /** Returns a list of all applications.
		@see getApplication
	*/
    BaaSKitAdmin.prototype.listAllApplications = function (callback) {

    	var colleciton = kDatabaseConnection.collection ('applications');

		colleciton.find ({}, {}, function (error, items) {

			items.toArray (function (error, items) {

				if (!error)
				{
					callback (null, items);
				}
				else
				{
					callback ({ 'message' : 'An unknown error occurred.' }, null);
				}
			});
		});
    };

    /** Returns an application with a specified Id.
		@see listAllApplications
	*/
    BaaSKitAdmin.prototype.getApplication = function (applicationId, callback) {

    	var colleciton = kDatabaseConnection.collection ('applications');

		colleciton.findOne ({ 'id' : applicationId }, function (error, object) {

			if (object != null)
			{
				callback (null, object);
			}
			else
			{
				callback ({ 'message' : 'An application with that id does not exist.' });
			}
		});
    };

	/** Generates a new clientKey for an application with a specified Id.
		@see createApplicaiton
	*/
    BaaSKitAdmin.prototype.generateApplicationClientKey = function (applicationId, callback) {

		var colleciton = kDatabaseConnection.collection ('applications');
		
		colleciton.findOne ({ 'id' : applicationId }, function (error, item) {

			if (item != null)
			{
				var confirmation = function (ok) {

					if (ok)
					{
						var newClientKey = libcrypto.randomBytes (12).toString ('hex');
						var operator = { $set : { 'clientKey' : newClientKey } };

						colleciton.update (item, operator, function (error, result) {

							if (!error)
							{
								callback (null);
							}
							else
							{
								callback ({ 'message' : 'An unknown error occurred.' });
							}
						});
					}
					else
					{
						callback ({ 'message' : 'goodbye' });
					}
				};

				if (this.asksForUserConfirmation)
				{
					libcommander.confirm ('Are you sure you want to generate a new client key for this application? ', function (ok) {

						confirmation (ok);
					});
				}
				else
				{
					confirmation (true);
				}
			}
			else
			{
				callback ({ 'message' : 'An application with that id does not exist.' });
			}
		});
    };

    asksForUserConfirmation = false;

    return BaaSKitAdmin;
})();

exports.BaaSKitAdmin = BaaSKitAdmin;