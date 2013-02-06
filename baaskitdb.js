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
var libmongo = require ('mongodb');

//==============================================================================
var MongoServer = libmongo.Server;
var MongoDatabase = libmongo.Db;

//==============================================================================
/** BaaSKitAppDbPool

	A simple shared database instance object Queue/FIFO list.
*/
var BaaSKitAppDbPool = (function () {

	/** Creates an BaaSKitAppDbPool object.
		@param maxNumberOfApps	The maximum number of shared db objects to keep 
								arround.
	*/
    function BaaSKitAppDbPool (maxNumberOfApps)
    {
    	this.maxNumApps = Math.max (maxNumberOfApps, 1);
    	this.lookup = {};
    	this.stack = [];
    }

    /** Returns a shared database object using the current socket connection. 
    	If the maximum number of db objects to keep around has been reached the 
    	last item in the list will be popped.
    */
    BaaSKitAppDbPool.prototype.getDb = function (appId) {

    	if (this.stack.length >= this.maxNumApps)
		{
			var poppedAppId = this.stack.pop();
			delete this.lookup [poppedAppId];
		}

		var result = null;

		if (this.lookup[appId] != null)
		{
			result = this.lookup [appId];
		}
		else
		{
			this.stack.unshift (appId);

			result = BaaSKitDb.getInstance().getMainDb().db (appId);
			this.lookup[appId] = result;
		}

		return result;
	};

    return BaaSKitAppDbPool;

})();

//==============================================================================
/** BaaSKitDb singleton class 
	
	Used to get an instance of a database connection object.

	@code
	var db = BaaSKitDb.getInstance().getMainDb();
	@endcode
*/
var BaaSKitDb = (function () {

    function BaaSKitDb()
    {
    	this.mongoServer = new MongoServer ('localhost', 27017, { auto_reconnect : true, poolSize: 32 });
		this.databaseConnection = new MongoDatabase ('baaskitdb', this.mongoServer, { w : 0 });
		this.appDbPool = new BaaSKitAppDbPool (64);

		this.databaseConnection.open (function (error, databse) {
			
			libassert.equal (null, error, 'Could not connect to mongodb.');
		});
    }

    BaaSKitDb.prototype.getMainDb = function() {

    	return this.databaseConnection;
    }

    BaaSKitDb.prototype.getAppDb = function (appId) {

    	var pool = this.appDbPool;
    	return pool.getDb (appId);
    }

    var instance = null;
	return {
		getInstance: function() 
        {
			if (instance == null)
			{
				instance = new BaaSKitDb();
			}

            return instance;
        }
	};

})();

exports.BaaSKitDb = BaaSKitDb;