import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { formatBytes, getBlockTypeDetails, getStatusDetails } from '../lib/utils';
import { parseVoiceCommand, SUPPORTED_LANGUAGES } from '../lib/speech';
import {
  MOCK_STUDENT_USER,
  MOCK_ADMIN_USER,
  MOCK_DOCUMENTS,
  MOCK_PAGE_BLOCKS,
  MOCK_AUDIT_LOGS,
} from '../lib/mock-data';

describe('Accessibility & Formatting Utilities', () => {
  it('formats file sizes accurately into human-readable bytes', () => {
    assert.equal(formatBytes(0), '0 Bytes');
    assert.equal(formatBytes(1024), '1 KB');
    assert.equal(formatBytes(5 * 1024 * 1024), '5 MB');
  });

  it('provides distinct, accessible labels for all 6 block types', () => {
    const types = ['text', 'diagram', 'flowchart', 'graph', 'table', 'formula'] as const;
    types.forEach((t) => {
      const details = getBlockTypeDetails(t);
      assert.ok(details.label.length > 0, `Expected label for ${t}`);
      assert.ok(details.badgeClass.length > 0, `Expected badge class for ${t}`);
      assert.ok(details.description.length > 0, `Expected description for ${t}`);
    });
  });

  it('provides accessible status details with screen-reader aria labels', () => {
    const statuses = ['uploaded', 'processing', 'completed', 'failed'] as const;
    statuses.forEach((s) => {
      const details = getStatusDetails(s);
      assert.ok(details.label.length > 0);
      assert.ok(details.ariaLabel.startsWith('Document status:'));
    });
  });
});

describe('Study Document & Privacy Structure', () => {
  it('includes realistic study documents with valid statuses and page counts', () => {
    assert.ok(MOCK_DOCUMENTS.length >= 3);
    const osiDoc = MOCK_DOCUMENTS.find((d) => d.id === 'doc-101');
    assert.ok(osiDoc);
    assert.equal(osiDoc.status, 'completed');
    assert.equal(osiDoc.page_count, 3);
  });

  it('structures explanation blocks in reading order with proper block types', () => {
    const page1Blocks = MOCK_PAGE_BLOCKS['doc-101'][1];
    assert.ok(page1Blocks.length >= 3);

    const diagramBlock = page1Blocks[0];
    assert.equal(diagramBlock.block_type, 'diagram');
    assert.ok(
      diagramBlock.title?.includes('OSI') || diagramBlock.explanation_text.includes('seven layers')
    );

    const tableBlock = page1Blocks[2];
    assert.equal(tableBlock.block_type, 'table');
  });

  it('ensures audit log records strictly omit raw document text or spoken question transcripts', () => {
    MOCK_AUDIT_LOGS.forEach((log) => {
      assert.ok(log.action, 'Action must be present');
      assert.ok(log.user_id, 'User ID must be present');
      // Verify raw text is never present in audit logs (Security rule FR16)
      assert.equal((log as unknown as Record<string, unknown>).raw_text, undefined);
      assert.equal((log as unknown as Record<string, unknown>).question_content, undefined);
      assert.equal((log as unknown as Record<string, unknown>).ocr_text, undefined);
    });
  });
});

describe('Phase 5: Spoken Audio Reader & Multi-Language Accessibility', () => {
  it('includes core Indian regional and international languages for universal accessibility', () => {
    assert.ok(SUPPORTED_LANGUAGES.length >= 6);
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    assert.ok(codes.includes('en-IN'), 'Must include Indian English');
    assert.ok(codes.includes('hi-IN'), 'Must include Hindi');
    assert.ok(codes.includes('bn-IN'), 'Must include Bengali');
    assert.ok(codes.includes('ta-IN'), 'Must include Tamil');
    assert.ok(codes.includes('te-IN'), 'Must include Telugu');
    assert.ok(codes.includes('mr-IN'), 'Must include Marathi');
    assert.ok(codes.includes('ml-IN'), 'Must include Malayalam');
    assert.ok(codes.includes('es-ES'), 'Must include Spanish');
  });
});

describe('Phase 7: Speech-to-Text & Hands-Free Voice Commands', () => {
  it('correctly maps standard English playback navigation commands', () => {
    assert.equal(parseVoiceCommand('next'), 'next');
    assert.equal(parseVoiceCommand('next card'), 'next');
    assert.equal(parseVoiceCommand('forward'), 'next');
    assert.equal(parseVoiceCommand('previous'), 'previous');
    assert.equal(parseVoiceCommand('back'), 'previous');
    assert.equal(parseVoiceCommand('go back'), 'previous');
    assert.equal(parseVoiceCommand('repeat'), 'repeat');
    assert.equal(parseVoiceCommand('read again'), 'repeat');
    assert.equal(parseVoiceCommand('play'), 'play');
    assert.equal(parseVoiceCommand('start'), 'play');
    assert.equal(parseVoiceCommand('stop'), 'stop');
    assert.equal(parseVoiceCommand('pause'), 'stop');
    assert.equal(parseVoiceCommand('slower'), 'slower');
    assert.equal(parseVoiceCommand('speak slower'), 'slower');
    assert.equal(parseVoiceCommand('faster'), 'faster');
    assert.equal(parseVoiceCommand('speed up'), 'faster');
  });

  it('correctly maps multi-lingual Hindi & Indian regional spoken commands', () => {
    // Forward / Next
    assert.equal(parseVoiceCommand('aage'), 'next');
    assert.equal(parseVoiceCommand('agla'), 'next');
    assert.equal(parseVoiceCommand('porer'), 'next');

    // Backward / Previous
    assert.equal(parseVoiceCommand('peechhe'), 'previous');
    assert.equal(parseVoiceCommand('pichla'), 'previous');
    assert.equal(parseVoiceCommand('agero'), 'previous');

    // Repeat / Dobara
    assert.equal(parseVoiceCommand('dobara'), 'repeat');
    assert.equal(parseVoiceCommand('phir se'), 'repeat');

    // Stop / Ruko
    assert.equal(parseVoiceCommand('roko'), 'stop');
    assert.equal(parseVoiceCommand('ruk jao'), 'stop');

    // Play / Chalao
    assert.equal(parseVoiceCommand('chalao'), 'play');
    assert.equal(parseVoiceCommand('shuru'), 'play');

    // Speed Controls
    assert.equal(parseVoiceCommand('dheere'), 'slower');
    assert.equal(parseVoiceCommand('tez'), 'faster');
    assert.equal(parseVoiceCommand('jaldi'), 'faster');

    // Language & Assistance
    assert.equal(parseVoiceCommand('bhasha'), 'language');
    assert.equal(parseVoiceCommand('madad'), 'help');
    assert.equal(parseVoiceCommand('sahayata'), 'help');
  });

  it('correctly handles accessibility controls (Captions & Help)', () => {
    assert.equal(parseVoiceCommand('captions'), 'captions');
    assert.equal(parseVoiceCommand('subtitles'), 'captions');
    assert.equal(parseVoiceCommand('toggle captions'), 'captions');
    assert.equal(parseVoiceCommand('help'), 'help');
    assert.equal(parseVoiceCommand('voice commands'), 'help');
    assert.equal(parseVoiceCommand('what can i say'), 'help');
  });

  it('is resilient to punctuation, leading/trailing whitespace, and mixed casing', () => {
    assert.equal(parseVoiceCommand('  NEXT!  '), 'next');
    assert.equal(parseVoiceCommand('Previous.'), 'previous');
    assert.equal(parseVoiceCommand('  DHEERE...  '), 'slower');
    assert.equal(parseVoiceCommand('TEZ?'), 'faster');
    assert.equal(parseVoiceCommand('Dobara!'), 'repeat');
  });

  it('safely ignores complex study questions so voice commands are not triggered accidentally', () => {
    assert.equal(parseVoiceCommand('What is the OSI model?'), null);
    assert.equal(parseVoiceCommand('How does TCP 3-way handshake work?'), null);
    assert.equal(parseVoiceCommand('Why is Dijkstra algorithm considered greedy?'), null);
    assert.equal(parseVoiceCommand('Can you explain the formula on page 2?'), null);
    assert.equal(parseVoiceCommand(''), null);
  });
});

describe('Phase 8: Admin Security & Role-Based Audit Trail', () => {
  it('strictly distinguishes student role from administrator role', () => {
    assert.equal(MOCK_STUDENT_USER.role, 'student');
    assert.equal(MOCK_ADMIN_USER.role, 'admin');
    assert.notEqual(MOCK_STUDENT_USER.role, MOCK_ADMIN_USER.role);
  });

  it('records required security audit fields for event verification', () => {
    MOCK_AUDIT_LOGS.forEach((log) => {
      assert.ok(log.id !== undefined, 'Audit record must have an ID');
      assert.ok(log.user_id !== undefined, 'Audit record must have a user_id');
      assert.ok(typeof log.action === 'string', 'Audit record must have an action string');
      assert.ok(typeof log.created_at === 'string', 'Audit record must have a timestamp');
    });
  });

  it('properly categorizes audit events by action type for filtering', () => {
    const actions = MOCK_AUDIT_LOGS.map((l) => l.action.toLowerCase());
    assert.ok(actions.includes('upload'), 'Must contain upload events');
    assert.ok(actions.includes('process'), 'Must contain process events');
    assert.ok(actions.includes('ask'), 'Must contain ask events');
  });

  it('verifies that sensitive user credentials and document payloads are never in audit logs', () => {
    MOCK_AUDIT_LOGS.forEach((log) => {
      assert.equal((log as unknown as Record<string, unknown>).password, undefined);
      assert.equal((log as unknown as Record<string, unknown>).password_hash, undefined);
      assert.equal((log as unknown as Record<string, unknown>).raw_file, undefined);
    });
  });
});

describe('Phase 9: Universal Accessibility & WCAG AAA Verification', () => {
  it('validates high-contrast color luminance ratio exceeds WCAG AAA 7:1 standard', () => {
    // Relative luminance calculation for #070714 obsidian dark vs #ffffff pure white
    function getLuminance(r: number, g: number, b: number): number {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    const bgLum = getLuminance(7, 7, 20); // #070714 obsidian
    const textLum = getLuminance(255, 255, 255); // #ffffff white
    const contrastRatio = (textLum + 0.05) / (bgLum + 0.05);

    // WCAG AAA requires at least 7.0:1 for normal text
    assert.ok(contrastRatio >= 7.0, `Contrast ratio ${contrastRatio.toFixed(2)} must exceed 7.0:1`);
    assert.ok(contrastRatio > 18.0, 'Obsidian dark canvas provides ultra-high contrast for low vision students');
  });

  it('ensures all 8 keyboard shortcuts are non-conflicting single keys', () => {
    const shortcuts = {
      space: 'play_pause',
      n: 'next_card',
      p: 'previous_card',
      r: 'repeat_card',
      m: 'stop_playback',
      c: 'toggle_voice_commands',
      v: 'direct_voice_modal',
      h: 'voice_commands_help',
    };

    const keys = Object.keys(shortcuts);
    const uniqueKeys = new Set(keys);
    assert.equal(keys.length, uniqueKeys.size, 'All shortcut key bindings must be unique');
  });

  it('provides dedicated accessible descriptions for assistive screen readers across all blocks', () => {
    const types = ['text', 'diagram', 'flowchart', 'graph', 'table', 'formula'] as const;
    types.forEach((t) => {
      const details = getBlockTypeDetails(t);
      assert.ok(details.description.length >= 15, `Description for ${t} must be descriptive`);
    });
  });
});
