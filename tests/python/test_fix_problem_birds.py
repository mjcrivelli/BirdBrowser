import json
import os
import sys
import shutil
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from fix_problem_birds import fix_problem_birds

PROBLEM_BIRDS = [
    "Saíra-sete-cores", "Saíra-militar", "Saí-verde", "Saí-azul",
    "Sanhaço-do-coqueiro", "Capitão-de-saíra", "Tiê-preto", "Gavião-pombo-pequeno",
]


class TestFixProblemBirds(unittest.TestCase):

    def setUp(self):
        self.old_cwd = os.getcwd()
        self.tmpdir = tempfile.mkdtemp()
        os.chdir(self.tmpdir)

    def tearDown(self):
        os.chdir(self.old_cwd)
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def _run(self, birds):
        with open('bird_data.json', 'w', encoding='utf-8') as f:
            json.dump(birds, f, ensure_ascii=False)
        fix_problem_birds()
        with open('bird_data.json', encoding='utf-8') as f:
            return json.load(f)

    def test_known_bird_url_updated(self):
        result = self._run([{'name': 'Saíra-sete-cores', 'imageUrl': 'https://old.jpg'}])
        self.assertIn('wikiaves', result[0]['imageUrl'])

    def test_unknown_bird_unchanged(self):
        url = 'https://example.com/bird.jpg'
        result = self._run([{'name': 'Pássaro Desconhecido', 'imageUrl': url}])
        self.assertEqual(result[0]['imageUrl'], url)

    def test_idempotent_when_url_already_correct(self):
        correct = 'https://s3.amazonaws.com/media.wikiaves.com.br/images/5195/1649395_7d9fa3af51e7b71d5a1a96eb61d4eb64.jpg'
        result = self._run([{'name': 'Saíra-sete-cores', 'imageUrl': correct}])
        self.assertEqual(result[0]['imageUrl'], correct)

    def test_all_problem_birds_get_wikiaves_url(self):
        birds = [{'name': n, 'imageUrl': 'https://old.jpg'} for n in PROBLEM_BIRDS]
        result = self._run(birds)
        for bird in result:
            self.assertIn('wikiaves', bird['imageUrl'], f"{bird['name']} deve ter URL do wikiaves")

    def test_empty_list_does_not_crash(self):
        self.assertEqual(self._run([]), [])

    def test_mixed_known_and_unknown(self):
        result = self._run([
            {'name': 'Saíra-sete-cores', 'imageUrl': 'https://old.jpg'},
            {'name': 'Desconhecido', 'imageUrl': 'https://other.jpg'},
        ])
        self.assertIn('wikiaves', result[0]['imageUrl'])
        self.assertEqual(result[1]['imageUrl'], 'https://other.jpg')


if __name__ == '__main__':
    unittest.main()
