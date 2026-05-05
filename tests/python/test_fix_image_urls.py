import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from fix_image_urls import DIRECT_URLS, fix_bird_images


class TestFixBirdImages(unittest.TestCase):

    def setUp(self):
        tmp = tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False, encoding='utf-8'
        )
        self.path = tmp.name
        tmp.close()

    def tearDown(self):
        if os.path.exists(self.path):
            os.unlink(self.path)

    def _write(self, data):
        with open(self.path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)

    def _read(self):
        with open(self.path, encoding='utf-8') as f:
            return json.load(f)

    def test_known_bird_gets_direct_url(self):
        name = next(iter(DIRECT_URLS))
        self._write([{'name': name, 'imageUrl': 'https://old.jpg'}])
        self.assertTrue(fix_bird_images(self.path))
        self.assertEqual(self._read()[0]['imageUrl'], DIRECT_URLS[name])

    def test_all_known_birds_updated(self):
        birds = [{'name': n, 'imageUrl': 'https://old.jpg'} for n in DIRECT_URLS]
        self._write(birds)
        fix_bird_images(self.path)
        for bird in self._read():
            self.assertEqual(bird['imageUrl'], DIRECT_URLS[bird['name']])

    def test_special_filepath_converted_to_wikimedia(self):
        self._write([{
            'name': 'Pássaro X',
            'imageUrl': 'https://pt.wikipedia.org/wiki/Special:FilePath/Bird.jpg'
        }])
        fix_bird_images(self.path)
        url = self._read()[0]['imageUrl']
        self.assertIn('upload.wikimedia.org', url)
        self.assertNotIn('Special:FilePath', url)

    def test_normal_url_not_changed(self):
        original = 'https://upload.wikimedia.org/wikipedia/commons/a/b/bird.jpg'
        self._write([{'name': 'Normal', 'imageUrl': original}])
        fix_bird_images(self.path)
        self.assertEqual(self._read()[0]['imageUrl'], original)

    def test_empty_list_returns_true(self):
        self._write([])
        self.assertTrue(fix_bird_images(self.path))
        self.assertEqual(self._read(), [])

    def test_returns_false_on_missing_file(self):
        self.assertFalse(fix_bird_images('/nonexistent/path/file.json'))

    def test_mixed_birds_processed_correctly(self):
        known_name = next(iter(DIRECT_URLS))
        original_url = 'https://upload.wikimedia.org/wikipedia/commons/x/bird.jpg'
        self._write([
            {'name': known_name, 'imageUrl': 'https://old.jpg'},
            {'name': 'Desconhecido', 'imageUrl': original_url},
        ])
        fix_bird_images(self.path)
        result = self._read()
        self.assertEqual(result[0]['imageUrl'], DIRECT_URLS[known_name])
        self.assertEqual(result[1]['imageUrl'], original_url)


if __name__ == '__main__':
    unittest.main()
