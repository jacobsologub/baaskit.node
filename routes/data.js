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
var BSON = libmongo.BSONPure;

var kMongoServer = new MongoServer ('localhost', 27017, { auto_reconnect : true, poolSize: 32 });
var kDatabaseConnection = new MongoDatabase ('baaskitdb', kMongoServer, { w : 0 });

kDatabaseConnection.open (function (error, databse) {
  libassert.equal (null, error, 'Could not connect to mongodb.');
});

//==============================================================================
/** Creates a new document in the specified collection.

	@param request.params.collectionName	The name of the collection.
	@param request.body						The object in JSON format.
*/
exports.post = function (request, response) {

	if (request.body == null)
		return;

	var app = {
		'id' : request.header ('X-BaaSKit-Application-Id'),
		'clientKey' : request.header ('X-BaaSKit-Application-Client-Key')
	};

	var collection = kDatabaseConnection.collection ('applications');
	collection.findOne (app, function (error, item) {

		if (item != null)
		{
			var appDb = kDatabaseConnection.db (app ['id']);
			collection = appDb.collection (request.params.collectionName);

			collection.insert (request.body, function (error, object) {

				if (!error)
				{
					response.send (201, request.path + '/' + object [0]['_id']);
				}
				else
				{
					response.send (500);
				}

			});
		}
		else
		{
			response.send (400);
		}
	});
};

//==============================================================================
/** Returns one or multiple documents in the specified collection.

	@param request.params.collectionName	The name of the collection.
	@param request.params.objectId			The object id (optional).
*/
exports.get = function (request, response) {

	var app = {
		'id' : request.header ('X-BaaSKit-Application-Id'),
		'clientKey' : request.header ('X-BaaSKit-Application-Client-Key')
	};

	var collection = kDatabaseConnection.collection ('applications');
	collection.findOne (app, function (error, item) {

		if (item != null)
		{
			var appDb = kDatabaseConnection.db (app ['id']);
			collection = appDb.collection (request.params.collectionName);

			if (request.params.objectId != null && request.params.objectId != 'count')
			{
				var object = {

					'_id' : new BSON.ObjectID (request.params.objectId)
				};

				collection.findOne (object, function (error, item) {

					if (!error)
					{
						if (item != null)
						{
							response.send (200, item);
						}
						else
						{
							response.send (404);
						}
					}
					else
					{
						response.send (500);
					}
				});
			}
			else
			{
				var query = null;
				try
				{
					query = JSON.parse (request.query.query);
				}
				catch (e) 
				{
					query = {};
				}

				var options = {

					'limit' : request.query.limit,
					'skip' : request.query.skip,
					'explain' : request.query.explain
				};

				try
				{
					options ['sort'] = JSON.parse (request.query.sort);
					options ['fields'] = JSON.parse (request.query.fields);
				}
				catch (e)
				{
					options ['sort'] = {};
					options ['fields'] = {};
				}

				if (request.params.objectId == 'count')
				{
					collection.count (query, options, function (error, count) {

						if (!error)
						{
							response.send (200, { "count" : count });
						}
						else
						{
							response.send (500);
						}

					});
				}
				else
				{
					collection.find (query, options, function (error, items) {

						if (!error)
						{
							items.toArray (function (error, items) {

								if (!error)
								{
									response.send (200, items);
								}
								else
								{
									response.send (500);
								}
							});
						}
						else 
						{
							response.send (500);
						}
					});
				}
			}
		}
		else
		{
			response.send (400);
		}
	});
};

//==============================================================================
/** Updates one or multiple documents in the specified collection. Currently to
	avoid accidental object content deletion this method requires at least one 
	of the following update operators: $inc, $rename, $set, $unset, $addToSet, 
	$pop, $pullAll, $pull, $pushAll, $push, $bit, $isolated.

	http://docs.mongodb.org/manual/reference/operators/#update-operators

	@param request.params.collectionName	The name of the collection.
	@param request.params.objectId			The object id (optional).
*/
exports.put = function (request, response) {

	if (!(('$inc' in request.body)
		|| ('$rename' in request.body)
		|| ('$set' in request.body)
		|| ('$unset' in request.body)
		|| ('$addToSet' in request.body)
		|| ('$pop' in request.body)
		|| ('$pullAll' in request.body)
		|| ('$pull' in request.body)
		|| ('$pushAll' in request.body)
		|| ('$push' in request.body)
		|| ('$bit' in request.body)
		|| ('$isolated' in request.body)))
	{
		response.send (400);
	}

	var app = {
		'id' : request.header ('X-BaaSKit-Application-Id'),
		'clientKey' : request.header ('X-BaaSKit-Application-Client-Key')
	};

	var collection = kDatabaseConnection.collection ('applications');
	collection.findOne (app, function (error, item) {

		if (item != null)
		{
			var appDb = kDatabaseConnection.db (app ['id']);
			collection = appDb.collection (request.params.collectionName);

			var query = null;

			if (request.params.objectId != null)
			{
				query = {

					'_id' : new BSON.ObjectID (request.params.objectId) 
				};
			}
			else
			{
				try
				{
					query = JSON.parse (request.query.query);
				}
				catch (e) 
				{
					query = {};
				}
			}

			var operator = request.body;

			var options = {
				'upsert' : request.query.upsert,
				'multi' : request.query.multi
			};

			collection.update (query, operator, options, function (error, object) {

				response.send (200, object);
			});
		}
		else
		{
			response.send (400);
		}
	});
};

//==============================================================================
/** Removes one or multiple documents in the specified collection.

	@param request.params.collectionName	The name of the collection.
	@param request.params.objectId			The object id (optional).
*/
exports.delete = function (request, response) {
	
	var app = {
		'id' : request.header ('X-BaaSKit-Application-Id'),
		'clientKey' : request.header ('X-BaaSKit-Application-Client-Key')
	};

	var collection = kDatabaseConnection.collection ('applications');
	collection.findOne (app, function (error, item) {

		if (item != null)
		{
			var appDb = kDatabaseConnection.db (app ['id']);
			collection = appDb.collection (request.params.collectionName);

			var query = null;

			if (request.params.objectId != null)
			{
				query = {

					'_id' : new BSON.ObjectID (request.params.objectId) 
				};
			}
			else
			{
				try
				{
					query = JSON.parse (request.query.query);
				}
				catch (e) 
				{
					query = {};
				}
			}

			var operator = request.body;

			var options = {
				'single' : request.query.single
			};

			collection.remove (query, options, function (error, result) {

				response.send (!error ? 200 : 500);
			});
		}
		else
		{
			response.send (400);
		}
	});

};