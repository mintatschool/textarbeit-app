
import { getVerbPuzzleParts, Tense } from './src/utils/verbUtils.js';

// Mock data
const mockKönnen = { ich: 'kann', du: 'kannst', er_sie_es: 'kann' };
const mockSein = { ich: 'bin', du: 'bist', er_sie_es: 'ist' };
const mockMachen = { ich: 'mache', du: 'machst', er_sie_es: 'macht' };
const mockWissen = { ich: 'weiß', du: 'weißt', er_sie_es: 'weiß' };
const mockMüssen = { ich: 'muss', du: 'musst', er_sie_es: 'muss' };
const mockWerden = { ich: 'werde', du: 'wirst', er_sie_es: 'wird' };

function test(verbName, pronoun, conjugated, tense, conjugationData, expectedTarget) {
    const result = getVerbPuzzleParts(conjugated, tense, pronoun, conjugationData);
    const passed = result.target === expectedTarget;
    console.log(`${passed ? '✅' : '❌'} ${verbName} (${pronoun}): "${conjugated}" -> target: "${result.target}" (Expected: "${expectedTarget}")`);
    if (!passed) console.log('   Full result:', result);
}

console.log('--- Verification Started ---');

// Können: ich/er should be protected (identity), du should split (regular suffix st)
test('können', 'ich', 'kann', Tense.PRAESENS, mockKönnen, '');
test('können', 'du', 'kannst', Tense.PRAESENS, mockKönnen, 'st');
test('können', 'er_sie_es', 'kann', Tense.PRAESENS, mockKönnen, '');

// Sein: All protected
test('sein', 'ich', 'bin', Tense.PRAESENS, mockSein, '');
test('sein', 'du', 'bist', Tense.PRAESENS, mockSein, '');
test('sein', 'er_sie_es', 'ist', Tense.PRAESENS, mockSein, '');

// Machen: Regular split
test('machen', 'ich', 'mache', Tense.PRAESENS, mockMachen, 'e');
test('machen', 'du', 'machst', Tense.PRAESENS, mockMachen, 'st');

// Wissen: ich/er protected, du split ('t' suffix)
test('wissen', 'ich', 'weiß', Tense.PRAESENS, mockWissen, '');
test('wissen', 'du', 'weißt', Tense.PRAESENS, mockWissen, 't'); // 'weißt' ends in 't'. Stem 'weiß'. 
test('wissen', 'er_sie_es', 'weiß', Tense.PRAESENS, mockWissen, '');

// Müssen: du musst protected (to avoid 'mus'+'st')
test('müssen', 'du', 'musst', Tense.PRAESENS, mockMüssen, '');

// Werden: du wirst protected (to avoid 'wir'+'st')
test('werden', 'du', 'wirst', Tense.PRAESENS, mockWerden, '');

console.log('--- Verification Finished ---');
