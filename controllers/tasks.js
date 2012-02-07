var azure = require('azure'),
    uuid = require('node-uuid'),
    everyauth = require('everyauth'),
    tableName = 'tasks',
    partitionKey = 'partition1';

module.exports = Tasks;

function Tasks(storageClient) {
    this.storageClient = storageClient;
    storageClient.createTableIfNotExists(tableName, 
        function tableCreated(error){
	    if(error){
	        throw error;
	    }
        });
};

Tasks.prototype = {
        
    showItems: function (req, res) {
	var self = this;

	var query = azure.TableQuery
	    .select()
	    .from(tableName)
	    .where('completed eq ?', 'false');
		
	self.storageClient.queryEntities(query, 
	    function gotTasks(error, results){
	        if(error){
		    throw error;
		}

		res.render('tasks', { 
		    title: 'Tasks.  ',
		    tasklist: results || []
		});	    
	    });

    },
    
    newItem: function (req, res) {
	var self = this;
	    
        var item = req.body.item;
        item.RowKey = uuid();
        item.PartitionKey = partitionKey;
        item.completed = false;
        
	self.storageClient.insertEntity(tableName, item, 
	    function entityInserted(error) {
		if(error){	
		    throw error;
		}
		self.showItems(req, res);
	    });
    
    },

    complete: function(req, res){
        var self = this;

        self.storageClient.queryEntity(tableName, partitionKey, 
            req.body.item.RowKey, function entityQueried(error, entity){
                if(error){
                    throw error;
                }
                entity.completed = true;

                self.storageClient.updateEntity(tableName, entity, 
                    function entityUpdated(error){
                        if(error){
                            throw error;
                        }
                        self.showItems(req, res);
                    });           
            });


    }
};