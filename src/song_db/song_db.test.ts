import { assert } from 'chai';
import path from 'path';
import SongDB from './song_db';
import SongDBInterface from './song_db_ipc_interface';

// Returns a unique string each time to be used as a database name
let id = 0;
export function unique_db_location(dir: string) {
  const name = `SongDB-Test-${id++}`;
  return path.join(dir, name);
}

export default function TestSongDB(
  db_directory: string,
  name: string,
  createDB: (db_location: string) => SongDB | SongDBInterface,
  finish: () => void
) {
  describe(`${name} open existing database and fetch information`, () => {
    it('finds existing cache information', async () => {
      const db_location = path.join(__dirname, '..', '..', 'src', 'song_db', 'song_db.test.db');
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const song_uid1 = 'yt$IK-IlYIQvcU';

      const expected_info0 = {
        cached: true,
        cache_location: 'cache/location0',
        start_chunk: 0,
        end_chunk: 212,
        size_bytes: 128,
        playbacks: 3,
      };
      const expected_info1 = {
        cached: false,
        cache_location: 'cache/location1',
        start_chunk: -1,
        end_chunk: -1,
        size_bytes: 0,
        playbacks: 1,
      };
      const actual0 = await song_db.getCacheInfo(song_uid0);
      const actual1 = await song_db.getCacheInfo(song_uid1);
      assert.deepEqual(actual0, expected_info0, 'Fetches cache info correctly');
      assert.deepEqual(actual1, expected_info1, 'Fetches cache info correctly');

      await song_db.close();
      finish();
    });

    it('finds existing song information', async () => {
      const db_location = path.join(__dirname, '..', '..', 'src', 'song_db.test.db');
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const song_uid1 = 'yt$IK-IlYIQvcU';

      const expected_info0 = {
        link: 'https://www.youtube.com/watch?v=M1vsdF4VfUo',
        thumbnail_url:
          'https://i.ytimg.com/vi/OSz516-6IR4/hqdefault.jpg?sqp=-oaymwEbCKgBEF5IVfKriqkDDggBFQAAiEIYAXABwAEG&rs=AOn4CLDSbi0rVlwaHd-iNfSxF5ZAqSypVQ',
        title: 'A New Era Begins',
        artist: 'Evan Call - Topic',
        duration: 132,
      };
      const expected_info1 = {
        link: 'https://www.youtube.com/watch?v=IK-IlYIQvcU',
        thumbnail_url:
          'https://i.ytimg.com/vi/OSz516-6IR4/hqdefault.jpg?sqp=-oaymwEbCKgBEF5IVfKriqkDDggBFQAAiEIYAXABwAEG&rs=AOn4CLDSbi0rVlwaHd-iNfSxF5ZAqSypVQ',
        title: "Violet's Final Letter",
        artist: 'Evan Call - Topic',
        duration: 132,
      };
      const actual0 = await song_db.getSongInfo(song_uid0);
      const actual1 = await song_db.getSongInfo(song_uid1);
      assert.deepEqual(actual0, expected_info0, 'Fetches song info correctly');
      assert.deepEqual(actual1, expected_info1, 'Fetches song info correctly');

      await song_db.close();
      finish();
    });

    it('finds existing locks', async () => {
      const db_location = path.join(__dirname, '..', '..', 'src', 'song_db.test.db');
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const song_uid1 = 'yt$IK-IlYIQvcU';

      const actual0 = await song_db.isLocked(song_uid0);
      const actual1 = await song_db.isLocked(song_uid1);
      assert.equal(actual0, false, 'Fetches non existing lock correctly');
      assert.equal(actual1, true, 'Fetches existing lock correctly');

      await song_db.close();
      finish();
    });
  });

  describe(`${name} cache/uncache song`, () => {
    it('caches a new songs', async () => {
      const db_location = unique_db_location(db_directory);
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const cache_location0 = 'cache/location0';
      await song_db.cacheSong(song_uid0, cache_location0);

      const song_uid1 = 'yt$IK-IlYIQvcU';
      const cache_location1 = 'cache/location1';
      await song_db.cacheSong(song_uid1, cache_location1);

      const expected_info0 = {
        cached: true,
        cache_location: cache_location0,
        start_chunk: -1,
        end_chunk: -1,
        size_bytes: 0,
        playbacks: 0,
      };
      const expected_info1 = {
        cached: true,
        cache_location: cache_location1,
        start_chunk: -1,
        end_chunk: -1,
        size_bytes: 0,
        playbacks: 0,
      };
      const actual0 = await song_db.getCacheInfo(song_uid0);
      const actual1 = await song_db.getCacheInfo(song_uid1);
      assert.deepEqual(actual0, expected_info0, 'Sets cache_location and link correctly and sets correct default');
      assert.deepEqual(actual1, expected_info1, 'Sets cache_location and link correctly and sets correct default');

      await song_db.close();
      finish();
    });

    it('does nothing if song is already cached, but updates values', async () => {
      const db_location = unique_db_location(db_directory);
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const cache_location0 = 'cache/location0';
      const cache_location1 = 'cache/location1';
      await song_db.cacheSong(song_uid0, cache_location0);
      await song_db.cacheSong(song_uid0, cache_location1);

      const expected_info0 = {
        cached: true,
        cache_location: cache_location1,
        start_chunk: -1,
        end_chunk: -1,
        size_bytes: 0,
        playbacks: 0,
      };
      const actual0 = await song_db.getCacheInfo(song_uid0);
      assert.deepEqual(actual0, expected_info0, 'Updates cache values');

      await song_db.close();
      finish();
    });

    it('uncaches song when requested', async () => {
      const db_location = unique_db_location(db_directory);
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const cache_location0 = 'cache/location0';
      await song_db.cacheSong(song_uid0, cache_location0);

      const song_uid1 = 'yt$IK-IlYIQvcU';
      const cache_location1 = 'cache/location1';
      await song_db.cacheSong(song_uid1, cache_location1);

      await song_db.uncacheSong(song_uid1);

      const expected_info0 = {
        cached: true,
        cache_location: cache_location0,
        start_chunk: -1,
        end_chunk: -1,
        size_bytes: 0,
        playbacks: 0,
      };
      const expected_info1 = {
        cached: false,
        cache_location: cache_location1,
        start_chunk: -1,
        end_chunk: -1,
        size_bytes: 0,
        playbacks: 0,
      };
      const actual0 = await song_db.getCacheInfo(song_uid0);
      const actual1 = await song_db.getCacheInfo(song_uid1);
      assert.deepEqual(actual0, expected_info0, 'Sets cache_location and link correctly and sets correct default');
      assert.deepEqual(actual1, expected_info1, 'Sets cache_location and link correctly and sets correct default');

      await song_db.close();
      finish();
    });

    it('sets new cache info correctly', async () => {
      const db_location = unique_db_location(db_directory);
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const cache_location0 = 'cache/location0';
      await song_db.cacheSong(song_uid0, cache_location0);

      const start_chunk = 0;
      const end_chunk = 123;
      const size_bytes = 128;
      const playbacks = 1;
      await song_db.setStartChunk(song_uid0, start_chunk);
      await song_db.setEndChunk(song_uid0, end_chunk);
      await song_db.setSizeBytes(song_uid0, size_bytes);
      await song_db.incrementPlaybacks(song_uid0);

      const expected_info0 = {
        cached: true,
        cache_location: cache_location0,
        start_chunk,
        end_chunk,
        size_bytes,
        playbacks,
      };
      const actual0 = await song_db.getCacheInfo(song_uid0);
      assert.deepEqual(actual0, expected_info0, 'Updates cache values');

      await song_db.close();
      finish();
    });

    it('throws error if setting cache info of unknown song', async () => {
      const db_location = unique_db_location(db_directory);
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const cache_location0 = 'cache/location0';
      await song_db.cacheSong(song_uid0, cache_location0);

      const song_uid1 = 'yt$IK-IlYIQvcU';

      const start_chunk = 0;
      const end_chunk = 123;
      const size_bytes = 128;
      try {
        await song_db.setStartChunk(song_uid1, start_chunk);
        assert.fail('Throws error when setting cache info of invalid song');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Song does not exist in song database');
      }
      try {
        await song_db.setEndChunk(song_uid1, end_chunk);
        assert.fail('Throws error when setting cache info of invalid song');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Song does not exist in song database');
      }
      try {
        await song_db.setSizeBytes(song_uid1, size_bytes);
        assert.fail('Throws error when setting cache info of invalid song');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Song does not exist in song database');
      }
      try {
        await song_db.incrementPlaybacks(song_uid1);
        assert.fail('Throws error when setting cache info of invalid song');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Song does not exist in song database');
      }

      const expected_info0 = {
        cached: true,
        cache_location: cache_location0,
        start_chunk: -1,
        end_chunk: -1,
        size_bytes: 0,
        playbacks: 0,
      };
      const actual0 = await song_db.getCacheInfo(song_uid0);
      assert.deepEqual(actual0, expected_info0, 'Does not edit other cache info');

      await song_db.close();
      finish();
    });

    it('throws error if uncaching unknown song', async () => {
      const db_location = unique_db_location(db_directory);
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const cache_location0 = 'cache/location0';
      await song_db.cacheSong(song_uid0, cache_location0);

      const song_uid1 = 'yt$IK-IlYIQvcU';
      const cache_location1 = 'cache/location1';
      await song_db.cacheSong(song_uid1, cache_location1);

      try {
        await song_db.uncacheSong('yt$unknownid');
        assert.fail('Throws error on unknown id');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Song does not exist in song database');
      }

      const expected_info0 = {
        cached: true,
        cache_location: cache_location0,
        start_chunk: -1,
        end_chunk: -1,
        size_bytes: 0,
        playbacks: 0,
      };
      const expected_info1 = {
        cached: true,
        cache_location: cache_location1,
        start_chunk: -1,
        end_chunk: -1,
        size_bytes: 0,
        playbacks: 0,
      };
      const actual0 = await song_db.getCacheInfo(song_uid0);
      const actual1 = await song_db.getCacheInfo(song_uid1);
      assert.deepEqual(actual0, expected_info0, 'Sets cache_location and link correctly and sets correct default');
      assert.deepEqual(actual1, expected_info1, 'Sets cache_location and link correctly and sets correct default');

      await song_db.close();
      finish();
    });
  });

  describe(`${name} get/set song info`, () => {
    it('sets default song info when caching new song', async () => {
      const db_location = unique_db_location(db_directory);
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const cache_location0 = 'cache/location0';
      await song_db.cacheSong(song_uid0, cache_location0);

      const expected0 = {
        link: '',
        thumbnail_url: '',
        title: 'Unknown',
        artist: 'Unknown',
        duration: -1,
      };
      const actual0 = await song_db.getSongInfo(song_uid0);
      assert.deepEqual(actual0, expected0, 'Sets correct default song info');

      await song_db.close();
      finish();
    });

    it('sets new song info correctly', async () => {
      const db_location = unique_db_location(db_directory);
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const cache_location0 = 'cache/location0';
      await song_db.cacheSong(song_uid0, cache_location0);

      const song_uid1 = 'yt$IK-IlYIQvcU';
      const cache_location1 = 'cache/location1';
      await song_db.cacheSong(song_uid1, cache_location1);

      const link = 'https://www.youtube.com/watch?v=M1vsdF4VfUo';
      const thumbnail_url =
        'https://i.ytimg.com/vi/OSz516-6IR4/hqdefault.jpg?sqp=-oaymwEbCKgBEF5IVfKriqkDDggBFQAAiEIYAXABwAEG&rs=AOn4CLDSbi0rVlwaHd-iNfSxF5ZAqSypVQ';
      const title = 'A New Era Begins';
      const artist = 'Evan Call - Topic';
      const duration = 132;
      await song_db.setLink(song_uid0, link);
      await song_db.setThumbnailUrl(song_uid0, thumbnail_url);
      await song_db.setTitle(song_uid0, title);
      await song_db.setArtist(song_uid0, artist);
      await song_db.setDuration(song_uid0, duration);

      const expected0 = { link, thumbnail_url, title, artist, duration };
      const actual0 = await song_db.getSongInfo(song_uid0);
      assert.deepEqual(actual0, expected0, 'Updates song info');
      const expected1 = {
        link: '',
        thumbnail_url: '',
        title: 'Unknown',
        artist: 'Unknown',
        duration: -1,
      };
      const actual1 = await song_db.getSongInfo(song_uid0);
      assert.deepEqual(actual1, expected1, 'Does not edit other song info');

      await song_db.close();
      finish();
    });

    it('sets throws error when setting song info of invalid song', async () => {
      const db_location = unique_db_location(db_directory);
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const cache_location0 = 'cache/location0';
      await song_db.cacheSong(song_uid0, cache_location0);

      const song_uid1 = 'yt$IK-IlYIQvcU';

      const link = 'https://www.youtube.com/watch?v=M1vsdF4VfUo';
      const thumbnail_url =
        'https://i.ytimg.com/vi/OSz516-6IR4/hqdefault.jpg?sqp=-oaymwEbCKgBEF5IVfKriqkDDggBFQAAiEIYAXABwAEG&rs=AOn4CLDSbi0rVlwaHd-iNfSxF5ZAqSypVQ';
      const title = 'A New Era Begins';
      const artist = 'Evan Call - Topic';
      const duration = 132;

      try {
        await song_db.setLink(song_uid1, link);
        assert.fail('Throws error when setting song info of invalid song');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Song does not exist in song database');
      }
      try {
        await song_db.setThumbnailUrl(song_uid1, thumbnail_url);
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Song does not exist in song database');
      }
      try {
        await song_db.setTitle(song_uid1, title);
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Song does not exist in song database');
      }
      try {
        await song_db.setArtist(song_uid1, artist);
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Song does not exist in song database');
      }
      try {
        await song_db.setDuration(song_uid1, duration);
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Song does not exist in song database');
      }

      const expected0 = {
        link: '',
        thumbnail_url: '',
        title: 'Unknown',
        artist: 'Unknown',
        duration: -1,
      };
      const actual0 = await song_db.getSongInfo(song_uid0);
      assert.deepEqual(actual0, expected0, 'Does not edit other song info');

      await song_db.close();
      finish();
    });
  });

  describe(`${name} add/remove locks`, () => {
    it('locks song then unknowns after locks are removed', async () => {
      const db_location = unique_db_location(db_directory);
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const cache_location0 = 'cache/location0';
      await song_db.cacheSong(song_uid0, cache_location0);

      const actual0 = await song_db.isLocked(song_uid0);
      assert.equal(actual0, false, 'Song is not locked when first created');

      const lock_id0 = await song_db.addLock(song_uid0);
      const actual1 = await song_db.isLocked(song_uid0);
      assert.equal(actual1, true, 'Song is locked when lock is added');

      const lock_id1 = await song_db.addLock(song_uid0);
      const actual2 = await song_db.isLocked(song_uid0);
      assert.equal(actual2, true, 'Song is locked when lock is added');

      await song_db.removeLock(lock_id0);
      const actual3 = await song_db.isLocked(song_uid0);
      assert.equal(actual3, true, 'Song is locked when one but not all locks are remove`d');

      await song_db.removeLock(lock_id1);
      const actual4 = await song_db.isLocked(song_uid0);
      assert.equal(actual4, false, 'Song is unlocked when all locks are removed');

      await song_db.close();
      finish();
    });

    it('throws error when adding/removing locks for unknown song', async () => {
      const db_location = unique_db_location(db_directory);
      const song_db = createDB(db_location);

      const song_uid0 = 'yt$M1vsdF4VfUo';
      const cache_location0 = 'cache/location0';
      await song_db.cacheSong(song_uid0, cache_location0);

      const song_uid1 = 'yt$IK-IlYIQvcU';

      try {
        await song_db.addLock(song_uid1);
        assert.fail('Throws error when adding lock for invalid song');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Song does not exist in song database');
      }

      const actual1 = await song_db.isLocked(song_uid0);
      assert.equal(actual1, false, 'Does not edit other locks');

      const lock_id0 = await song_db.addLock(song_uid0);
      try {
        await song_db.removeLock(lock_id0 + 1);
        assert.fail('Throws error when adding lock for invalid lock_id');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Lock does not exist in song database');
      }

      const actual2 = await song_db.isLocked(song_uid0);
      assert.equal(actual2, true, 'Does not edit other locks');

      await song_db.close();
      finish();
    });
  });
}
