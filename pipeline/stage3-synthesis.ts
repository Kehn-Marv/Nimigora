/**
 * Stage 3: Editorial Synthesis
 *
 * Takes fact sheets from Stage 2 and uses LLM to compose
 * full articles in Nimigora editorial style.
 */

import { llmGenerateJSON } from './llm';
import { FactSheet } from './stage2-extraction';
import { generateSlug, calculateReadTime, now } from './utils';
import { Article, PipelineStep, Category } from '@/lib/types';

// ============================================
// Types
// ============================================

interface SynthesizedArticle {
  headline: string;
  deck: string;
  body: string[];
  discoveryDesc: string;
  extractionDesc: string;
  synthesisDesc: string;
}

export interface SynthesisResult {
  articles: Article[];
  timestamp: string;
}

// ============================================
// System Prompt
// ============================================

const SYNTHESIS_SYSTEM_PROMPT = `You are a senior correspondent writing for a respected international publication. Your writing is warm, deeply human, and richly detailed while remaining entirely professional.

VOICE AND TONE:
- Write with the quiet authority of a seasoned journalist who has spent years on the ground. Your prose should feel lived-in, not mechanical.
- Be vivid and concrete. Use phrases like "casting a harsh spotlight," "paint a grim picture," or "pushing an already vulnerable population closer to the brink." This is NOT sensationalism. This is precise, evocative language that makes the reader feel the weight of the story.
- Never sound like a robot summarizing bullet points. Every paragraph should read as if a thoughtful human being sat down and carefully composed it.
- Maintain objectivity throughout. You are not an activist. You present the facts with such richness and context that the reader draws their own conclusions.

PARAGRAPH CRAFT:
- Each paragraph should be 3 to 5 sentences. Substantial enough to develop a complete thought, but short enough to maintain momentum.
- Transitions between paragraphs must be seamless. Use bridging phrases that connect ideas naturally: "Meanwhile," "These reports come as," "Analysts suggest that," "Reflecting on the long-term impact," "The rise in X serves as a Y indicator of Z."
- Do NOT start consecutive paragraphs with the same word or structure. Vary your openings.

QUOTES:
- When a quote carries real emotional or analytical weight, give it its own standalone paragraph formatted in italics-style emphasis.
- Weave shorter quotes directly into the body of a paragraph where they support a point.

HEADLINES:
- Highly engaging, dynamic, and authoritative. Use strong active verbs and striking nouns. Create a sense of urgency or profound impact without resorting to cheap clickbait.
- Avoid passive voice, questions, and generic summaries. Headlines should compel the reader to click by highlighting the most dramatic or consequential aspect of the story.
- Good examples: "Global Markets Tremble as Tech Giants Face Unprecedented Antitrust Sweep" / "Arctic Ice Collapse Threatens Global Shipping Routes, Scientists Warn" / "Breakthrough AI Model Shocks Medical Establishment with Diagnostic Accuracy"

STRUCTURE:
1. OPENING (1 paragraph): A strong lede that immediately grounds the reader in the most critical development. Set the scene, identify the stakes, and establish why this matters right now. 3 to 5 sentences.
2. BODY (5 to 8 paragraphs): Build the story layer by layer. Start with the immediate facts, then zoom out to provide historical context, systemic factors, and human impact. Weave in statistics naturally so they feel like revelations, not data dumps. Include direct quotes from relevant figures to add human voices.
3. CLOSING (1 paragraph): A forward-looking paragraph that frames what comes next without resorting to cliches. No "only time will tell." Instead, clearly state the unresolved tensions or the actions required, grounded in facts.

BANNED PHRASES (these are hallmarks of AI-generated text):
"In conclusion," "It remains to be seen," "Only time will tell," "A stark reminder," "Delving into," "Navigating the landscape," "A tapestry of," "In an era of," "It's worth noting," "This begs the question," "At the end of the day," "Moving forward," "Underscores the importance," "Raises important questions," "Sheds light on," "Game-changer," "Paradigm shift," "Double-edged sword," "Sends a clear message."

NO HALLUCINATION: Only use facts, quotes, and statistics from the provided fact sheet. You may craft the narrative framing and transitions, but never invent details, quotes, or events.

ADAPTABILITY:
- Match your tone to the weight of the story. A humanitarian crisis demands gravity. A celebrity controversy can be written with sharp wit. A scientific breakthrough can carry genuine awe. Do not force the same somber tone on every story. A great newsroom covers the full range of human experience, and your voice should reflect that.
- For lighter or entertaining stories, you may be more playful and direct, but never descend into gossip-column slang. Stay intelligent and well-crafted even when the subject matter is fun.

CATEGORY ADJUSTMENTS:
- TECHNOLOGY: Ground the story in real products, real companies, and real user impact. Avoid hype.
- GEOPOLITICS: Center humanitarian stakes and diplomatic complexity. Show the human cost.
- CLIMATE: Lead with data and infrastructure. Connect policy decisions to lived consequences.
- FINANCE: Demystify institutional moves. Explain what market shifts mean for ordinary people.
- HEALTH: Anchor in peer-reviewed science. Balance clinical findings with patient impact.
- CULTURE: This is the broadest beat. Cover celebrity drama, viral controversies, entertainment industry moves, art world scandals, and cultural milestones with equal intelligence. Be sharp, witty, and culturally aware. Make the reader feel like they are getting the inside scoop from the smartest person in the room.`;

// ============================================
// Stage 3 Implementation
// ============================================

/**
 * Run Stage 3: Editorial Synthesis
 *
 * For each fact sheet, generate a complete article in Nimigora style.
 */
export async function runSynthesis(
  factSheets: FactSheet[],
  discoveryTimestamp: string,
  extractionTimestamp: string
): Promise<SynthesisResult> {
  console.log('\n✍️  STAGE 3: EDITORIAL SYNTHESIS');
  console.log('═'.repeat(50));

  const articles: Article[] = [];

  for (const factSheet of factSheets) {
    console.log(`\n  📝 Writing article for: ${factSheet.storyTitle}`);

    const userPrompt = `Write a complete article for Nimigora based on the following fact sheet.

FACT SHEET:
Title: ${factSheet.storyTitle || 'Untitled'}
Category: ${factSheet.category || 'GENERAL'}

KEY FACTS:
${(factSheet.keyFacts || []).map((f, i) => `${i + 1}. [${f.type}/${f.confidence}] ${f.claim} (Sources: ${(f.sources || []).join(', ')})`).join('\n')}

KEY QUOTES:
${(factSheet.keyQuotes || []).map((q, i) => `${i + 1}. ${q}`).join('\n')}

KEY STATISTICS:
${(factSheet.keyStatistics || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}

CONTEXTUAL BACKGROUND:
${factSheet.contextualBackground || 'Not available.'}

WHY IT MATTERS:
${factSheet.whyItMatters || 'Not available.'}

SOURCES REFERENCED:
${(factSheet.sourceNames || []).join(', ') || 'Not available'}

Return a JSON object with this exact structure:
{
  "headline": "A highly engaging, dynamic headline with an active verb that highlights the most consequential aspect of the story",
  "deck": "A single sentence that provides essential context and draws the reader in.",
  "body": ["paragraph 1", "paragraph 2", "...", "paragraph 7-10"],
  "discoveryDesc": "A highly specific 1-sentence description of how the news was sourced (e.g. 'Aggregated humanitarian reports, ceasefire analyses, and aid organization data')",
  "extractionDesc": "A highly specific 1-sentence description of the facts extracted (e.g. 'Compiled displacement statistics, aid restriction details, and diplomatic positions from 4 sources')",
  "synthesisDesc": "A highly specific 1-sentence description of the editorial process (e.g. 'Wove humanitarian data with diplomatic analysis to examine ceasefire fragility')"
}

IMPORTANT:
- Each paragraph must be 3 to 5 sentences, fully developed and richly written
- Transitions between paragraphs must flow naturally and seamlessly
- Give powerful direct quotes their own standalone paragraph
- Write as a thoughtful human journalist, not a machine summarizing data
- Do NOT wrap the headline in asterisks or any markdown
- ONLY use facts from the fact sheet above. Do NOT invent any details`;

    try {
      const synthesized = await llmGenerateJSON<SynthesizedArticle>(
        SYNTHESIS_SYSTEM_PROMPT,
        userPrompt,
        { temperature: 0.7, maxTokens: 8192 }
      );

      // Sanitize headline to strip any rogue markdown asterisks
      const cleanHeadline = synthesized.headline.replace(/\*\*/g, '').trim();
      const slug = generateSlug(cleanHeadline);
      const synthesisTimestamp = now();

      const article: Article = {
        slug,
        headline: cleanHeadline,
        deck: synthesized.deck.replace(/(\*\*|\*)/g, '').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'),
        category: factSheet.category as Category,
        body: synthesized.body.map(p => p.replace(/(\*\*|\*)/g, '').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')),
        publishedAt: synthesisTimestamp,
        readTime: calculateReadTime(synthesized.body),
        sources: factSheet.sourceNames,
        sourceUrls: factSheet.sourceUrls || [],
        pipelineSteps: [
          {
            name: 'Source Discovery',
            status: 'complete',
            timestamp: discoveryTimestamp,
            detail: synthesized.discoveryDesc,
          },
          {
            name: 'Fact Extraction',
            status: 'complete',
            timestamp: extractionTimestamp,
            detail: synthesized.extractionDesc,
          },
          {
            name: 'Editorial Synthesis',
            status: 'complete',
            timestamp: synthesisTimestamp,
            detail: synthesized.synthesisDesc,
          },
          {
            name: 'Quality Review',
            status: 'pending' as PipelineStep['status'],
            detail: 'Awaiting quality review',
          },
        ],
      };

      articles.push(article);
      console.log(`  ✓ Generated: "${synthesized.headline}" (${article.readTime} min read, ${synthesized.body.length} paragraphs)`);
    } catch (error) {
      console.error(`  ✗ Synthesis failed for "${factSheet.storyTitle}": ${(error as Error).message}`);
    }
  }

  console.log(`\n📊 Synthesis complete: ${articles.length} articles generated`);

  return {
    articles,
    timestamp: now(),
  };
}
