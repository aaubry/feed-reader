#!/bin/sh

curl -XDELETE "localhost:9200/feeds-*"
curl -XDELETE "localhost:9200/_template/feeds"
curl -XPUT "localhost:9200/_template/feeds" -d '
{
    "template": "feeds",
    "order": 1,
	"settings": {
        "number_of_shards": 2,
        "number_of_replicas": 0
    },
    "mappings": {
        "item": {
            "_id": {
                "path": "id"
            },
            "_field_names": {
                "enabled": false
            },
            "dynamic": "strict",
            "date_detection": false,
            "numeric_detection": false,
            "properties": {
                "id": { "type": "string", "index": "not_analyzed" },
				"feedId": { "type": "string", "index": "not_analyzed" },
				"title": { "type": "string" },
				"body": { "type": "string" },
				"guid": { "type": "string", "index": "no" },
				"link": { "type": "string", "index": "no" },
				"links": {
					"properties": {
                        "title": { "type": "string", "index": "no" },
                        "link": { "type": "string", "index": "no" }
                    }
				},
                "pubDate": { "type": "date", "format": "date_time", "index": "not_analyzed", "include_in_all": false },
				"thumbUrl": { "type": "string", "index": "no" },
				"readBy": { "type": "string", "index": "not_analyzed" }
            }
        }
    }
}
'
