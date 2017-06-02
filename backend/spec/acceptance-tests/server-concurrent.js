var TestServer = require("./test-server");
var Album = require("../../api-types");
var localRequest = require("./local-request");
require("../test-finished");

describe("Concurrent tag caching server", function() {
    var testServer;
    var bandcamp;
    var persister;

    beforeEach(function() {
        testServer = new TestServer();
        bandcamp = testServer.bandcamp;
        bandcamp.delay = 1;
        persister = testServer.persister;
    });

    afterEach(function(done) {
        testServer.stop().then(done);
    });

    it("only caches tag once when new request asks for tag in progress of update", function(done) {
        bandcamp.setAlbumsForTag("tag", [ new Album("0", "Album") ]);

        testServer
            .start()
            .then(() => localRequest(["tag"]))
            .then(() => localRequest(["tag"]))
            .delay(70)
            .then(() => localRequest(["tag"]))
            .then(albums => {
                    expect(bandcamp.tagsRequested.length).toBe(1);
                    expect(albums[0].name).toBe("Album");
                })
            .testFinished(done);
    });

    it("queues up tags to be updated and processes them in order", function(done) {
        bandcamp.setAlbumsForTag("tag1", [ new Album("0", "Album1") ]);
        bandcamp.setAlbumsForTag("tag2", [ new Album("1", "Album2") ]);

        testServer
            .start()
            .then(() => localRequest(["tag1", "tag2"]))
            .then(data => expect(data.data).toEqual([ "tag1", "tag2" ]))

            .delay(70)
            .then(() => expect(bandcamp.tagsRequested).toEqual([ "tag1", "tag2" ]))
            .then(() => localRequest([ "tag2" ]))
            .then(albums => expect(albums[0].name).toBe("Album2"))
            .testFinished(done);
    });

    it("uses seeder when config has seed set", function(done) {
        testServer.config.startSeed = "tag";

        var album1 = new Album("0", "Album1");
        var album2 = new Album("1", "Album2");
        bandcamp.setAlbumsForTag("tag", [ album1 ]);
        bandcamp.setAlbumsForTag("tag_sub1", [ album2 ]);
        bandcamp.setTagsForAlbum(album1, [ "tag_sub1" ]);

        testServer
            .start()
            .then(() => localRequest(["tag_sub1"])) // Cache once first
            .then(() => localRequest(["tag_sub1"]))
            .then(albums => {
                expect(albums.length).toBe(1);
                expect(albums[0].name).toEqual(album2.name);
            })
            .testFinished(done);
    });
});