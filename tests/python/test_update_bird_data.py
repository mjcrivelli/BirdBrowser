import json
import os
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
import update_bird_data

EXCEL_PATH = "attached_assets/aves_Toca_v2 (1).xlsx"
JSON_PATH = "bird_data.json"


class TestUpdateBirdDataFromExcel(unittest.TestCase):

    def setUp(self):
        self.old_cwd = os.getcwd()
        self.tmpdir = tempfile.mkdtemp()
        os.chdir(self.tmpdir)
        os.makedirs('attached_assets', exist_ok=True)

    def tearDown(self):
        os.chdir(self.old_cwd)
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def _write_json(self, data):
        with open(JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)

    def _read_json(self):
        with open(JSON_PATH, encoding='utf-8') as f:
            return json.load(f)

    def test_returns_early_when_excel_missing(self):
        # Não deve levantar exceção
        update_bird_data.update_bird_data_from_excel()

    def test_returns_early_when_json_missing(self):
        open(EXCEL_PATH, 'w').close()
        update_bird_data.update_bird_data_from_excel()

    @patch('update_bird_data.pd.read_excel')
    def test_updates_bird_url_from_excel(self, mock_excel):
        import pandas as pd
        self._write_json([{'name': 'Saíra-sete-cores', 'imageUrl': 'https://old.jpg'}])
        open(EXCEL_PATH, 'w').close()
        mock_excel.return_value = pd.DataFrame({
            'Nome Comum': ['Saíra-sete-cores'],
            'Picture': ['https://new.jpg'],
        })
        update_bird_data.update_bird_data_from_excel()
        self.assertEqual(self._read_json()[0]['imageUrl'], 'https://new.jpg')

    @patch('update_bird_data.pd.read_excel')
    def test_does_not_update_when_url_unchanged(self, mock_excel):
        import pandas as pd
        url = 'https://same.jpg'
        self._write_json([{'name': 'Saíra-sete-cores', 'imageUrl': url}])
        open(EXCEL_PATH, 'w').close()
        mock_excel.return_value = pd.DataFrame({
            'Nome Comum': ['Saíra-sete-cores'],
            'Picture': [url],
        })
        update_bird_data.update_bird_data_from_excel()
        self.assertEqual(self._read_json()[0]['imageUrl'], url)

    @patch('update_bird_data.pd.read_excel')
    def test_skips_bird_not_in_excel(self, mock_excel):
        import pandas as pd
        original = 'https://unchanged.jpg'
        self._write_json([{'name': 'Desconhecido', 'imageUrl': original}])
        open(EXCEL_PATH, 'w').close()
        mock_excel.return_value = pd.DataFrame({
            'Nome Comum': ['Outro Pássaro'],
            'Picture': ['https://other.jpg'],
        })
        update_bird_data.update_bird_data_from_excel()
        self.assertEqual(self._read_json()[0]['imageUrl'], original)

    @patch('update_bird_data.pd.read_excel')
    def test_multiple_birds_updated_correctly(self, mock_excel):
        import pandas as pd
        self._write_json([
            {'name': 'Ave A', 'imageUrl': 'https://old-a.jpg'},
            {'name': 'Ave B', 'imageUrl': 'https://old-b.jpg'},
        ])
        open(EXCEL_PATH, 'w').close()
        mock_excel.return_value = pd.DataFrame({
            'Nome Comum': ['Ave A', 'Ave B'],
            'Picture': ['https://new-a.jpg', 'https://new-b.jpg'],
        })
        update_bird_data.update_bird_data_from_excel()
        result = self._read_json()
        self.assertEqual(result[0]['imageUrl'], 'https://new-a.jpg')
        self.assertEqual(result[1]['imageUrl'], 'https://new-b.jpg')


if __name__ == '__main__':
    unittest.main()
