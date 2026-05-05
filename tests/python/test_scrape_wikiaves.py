import os
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from scrape_wikiaves import get_wikiaves_image_url


def _resp(html='', status=200):
    m = MagicMock()
    m.status_code = status
    m.text = html
    return m


class TestGetWikiavesImageUrl(unittest.TestCase):

    @patch('scrape_wikiaves.requests.get')
    def test_extracts_from_contfoto(self, mock_get):
        html = '<html><body><div class="contfoto"><img src="https://example.com/bird.jpg" /></div></body></html>'
        mock_get.return_value = _resp(html)
        self.assertEqual(get_wikiaves_image_url('https://wikiaves.com.br/wiki/saira'), 'https://example.com/bird.jpg')

    @patch('scrape_wikiaves.requests.get')
    def test_contfoto_relative_url_made_absolute(self, mock_get):
        html = '<html><body><div class="contfoto"><img src="/fotos/bird.jpg" /></div></body></html>'
        mock_get.return_value = _resp(html)
        result = get_wikiaves_image_url('https://www.wikiaves.com.br/wiki/saira')
        self.assertTrue(result.startswith('https://'))
        self.assertIn('bird.jpg', result)

    @patch('scrape_wikiaves.requests.get')
    def test_falls_back_to_gallery(self, mock_get):
        html = '<html><body><div class="galeria-container"><img src="https://example.com/gallery.jpg" /></div></body></html>'
        mock_get.return_value = _resp(html)
        self.assertEqual(get_wikiaves_image_url('https://wikiaves.com.br/wiki/saira'), 'https://example.com/gallery.jpg')

    @patch('scrape_wikiaves.requests.get')
    def test_falls_back_to_fotos_in_src(self, mock_get):
        html = '<html><body><img src="https://example.com/fotos/bird.jpg" /></body></html>'
        mock_get.return_value = _resp(html)
        self.assertEqual(get_wikiaves_image_url('https://wikiaves.com.br/wiki/saira'), 'https://example.com/fotos/bird.jpg')

    @patch('scrape_wikiaves.requests.get')
    def test_skips_gif_images(self, mock_get):
        html = '<html><body><img src="https://example.com/fotos/icon.gif" /></body></html>'
        mock_get.return_value = _resp(html)
        self.assertIsNone(get_wikiaves_image_url('https://wikiaves.com.br/wiki/saira'))

    @patch('scrape_wikiaves.requests.get')
    def test_returns_none_on_non_200_status(self, mock_get):
        mock_get.return_value = _resp(status=404)
        self.assertIsNone(get_wikiaves_image_url('https://wikiaves.com.br/wiki/saira'))

    @patch('scrape_wikiaves.requests.get')
    def test_returns_none_when_no_image_found(self, mock_get):
        mock_get.return_value = _resp('<html><body><p>Sem foto</p></body></html>')
        self.assertIsNone(get_wikiaves_image_url('https://wikiaves.com.br/wiki/saira'))

    @patch('scrape_wikiaves.requests.get')
    def test_returns_none_on_exception(self, mock_get):
        mock_get.side_effect = Exception('Timeout')
        self.assertIsNone(get_wikiaves_image_url('https://wikiaves.com.br/wiki/saira'))


if __name__ == '__main__':
    unittest.main()
