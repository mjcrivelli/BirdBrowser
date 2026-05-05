import json
import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from scrape_wiki_images import DIRECT_URLS, fix_bird_data_json, get_wikipedia_image_url

INFOBOX_HTML = """<html><body>
<table class="infobox">
  <tr><td>
    <a class="image" href="/wiki/File:Bird.jpg">
      <img src="//upload.wikimedia.org/wikipedia/commons/thumb/a/b/Bird.jpg/220px-Bird.jpg" />
    </a>
  </td></tr>
</table>
</body></html>"""

FILE_PAGE_HTML = """<html><body>
<div class="fullImageLink">
  <a href="//upload.wikimedia.org/wikipedia/commons/a/b/Bird.jpg">Full</a>
</div>
</body></html>"""

CONTENT_DIV_HTML = """<html><body>
<div class="mw-parser-output">
  <img src="//upload.wikimedia.org/wikipedia/commons/thumb/a/b/Bird.jpg/220px-Bird.jpg" />
</div>
</body></html>"""


def _mock_response(html='', status=200):
    m = MagicMock()
    m.status_code = status
    m.text = html
    m.raise_for_status = MagicMock()
    return m


class TestGetWikipediaImageUrl(unittest.TestCase):

    def test_returns_none_for_empty_string(self):
        self.assertIsNone(get_wikipedia_image_url(''))

    def test_returns_none_for_none(self):
        self.assertIsNone(get_wikipedia_image_url(None))

    @patch('scrape_wiki_images.time.sleep')
    @patch('scrape_wiki_images.requests.get')
    def test_extracts_image_from_infobox(self, mock_get, _sleep):
        mock_get.side_effect = [
            _mock_response(INFOBOX_HTML),
            _mock_response(FILE_PAGE_HTML),
        ]
        result = get_wikipedia_image_url('https://pt.wikipedia.org/wiki/Some_Bird')
        self.assertIsNotNone(result)
        self.assertIn('upload.wikimedia.org', result)

    @patch('scrape_wiki_images.time.sleep')
    @patch('scrape_wiki_images.requests.get')
    def test_falls_back_to_content_div(self, mock_get, _sleep):
        mock_get.return_value = _mock_response(CONTENT_DIV_HTML)
        result = get_wikipedia_image_url('https://pt.wikipedia.org/wiki/Some_Bird')
        self.assertIsNotNone(result)

    @patch('scrape_wiki_images.time.sleep')
    @patch('scrape_wiki_images.requests.get')
    def test_returns_none_when_no_image_found(self, mock_get, _sleep):
        mock_get.return_value = _mock_response('<html><body><p>Sem imagem</p></body></html>')
        self.assertIsNone(get_wikipedia_image_url('https://pt.wikipedia.org/wiki/Some_Bird'))

    @patch('scrape_wiki_images.time.sleep')
    @patch('scrape_wiki_images.requests.get')
    def test_returns_none_on_request_exception(self, mock_get, _sleep):
        mock_get.side_effect = Exception('Erro de rede')
        self.assertIsNone(get_wikipedia_image_url('https://pt.wikipedia.org/wiki/Some_Bird'))


class TestFixBirdDataJson(unittest.TestCase):

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

    def test_applies_direct_url_for_known_bird(self):
        name = next(iter(DIRECT_URLS))
        self._write([{'name': name, 'imageUrl': '', 'wikipediaUrl': ''}])
        fix_bird_data_json(self.path)
        self.assertEqual(self._read()[0]['imageUrl'], DIRECT_URLS[name])

    def test_skips_bird_with_upload_wikimedia_url(self):
        direct = 'https://upload.wikimedia.org/wikipedia/commons/a/b/Bird.jpg'
        self._write([{
            'name': 'Desconhecido',
            'imageUrl': direct,
            'wikipediaUrl': 'https://pt.wikipedia.org/wiki/X',
        }])
        fix_bird_data_json(self.path)
        self.assertEqual(self._read()[0]['imageUrl'], direct)

    def test_converts_special_filepath_when_no_direct_url_found(self):
        self._write([{
            'name': 'Desconhecido',
            'imageUrl': 'https://pt.wikipedia.org/wiki/Special:FilePath/Bird.jpg',
            'wikipediaUrl': 'https://pt.wikipedia.org/wiki/X',
        }])
        with patch('scrape_wiki_images.get_wikipedia_image_url', return_value=None):
            fix_bird_data_json(self.path)
        url = self._read()[0]['imageUrl']
        self.assertNotIn('Special:FilePath', url)
        self.assertIn('upload.wikimedia.org', url)

    def test_returns_false_on_missing_file(self):
        self.assertFalse(fix_bird_data_json('/nao/existe/arquivo.json'))

    def test_returns_true_on_success(self):
        self._write([])
        self.assertTrue(fix_bird_data_json(self.path))


if __name__ == '__main__':
    unittest.main()
