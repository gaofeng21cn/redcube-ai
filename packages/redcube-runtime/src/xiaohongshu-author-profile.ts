import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const DEFAULT_PROFILE_ID = 'redcube_author';
const DEFAULT_SIGNATURE_DISPLAY = 'RedCube AI';
const DEFAULT_SIGNATURE_SUBTITLE = '请改成你的署名与品牌';

type IdentityProfile = {
  displayName?: string;
  signatureDisplay?: string;
  signatureSubtitle?: string;
};

type IdentityConfig = {
  defaultProfileId?: string;
  routing?: {
    medicalProfileId?: string;
    generalProfileId?: string;
  };
  profiles?: Record<string, IdentityProfile>;
};

function safeText(value: unknown, fallback = ''): string {
  return String(value || '').trim() || fallback;
}

function identityFile(workspaceRoot: string): string {
  return path.join(path.resolve(workspaceRoot), '.redcube', 'identity.json');
}

function defaultIdentity(): Required<IdentityConfig> {
  return {
    defaultProfileId: DEFAULT_PROFILE_ID,
    routing: {
      medicalProfileId: DEFAULT_PROFILE_ID,
      generalProfileId: DEFAULT_PROFILE_ID,
    },
    profiles: {
      [DEFAULT_PROFILE_ID]: {
        signatureDisplay: DEFAULT_SIGNATURE_DISPLAY,
        signatureSubtitle: DEFAULT_SIGNATURE_SUBTITLE,
      },
    },
  };
}

function readIdentity(workspaceRoot: string): IdentityConfig {
  const file = identityFile(workspaceRoot);
  return existsSync(file)
    ? JSON.parse(readFileSync(file, 'utf-8')) as IdentityConfig
    : defaultIdentity();
}

function isMedicalTopic(text: string): boolean {
  return /(医|临床|内分泌|甲状腺|垂体|肾上腺|糖尿病|疾病|诊疗|症状|治疗|预后|药物|手术|生命科学|健康)/i.test(text);
}

export function ensureWorkspaceXiaohongshuAuthorTemplate({ workspaceRoot }: { workspaceRoot: string }) {
  const file = identityFile(workspaceRoot);
  if (!existsSync(file)) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(defaultIdentity(), null, 2)}\n`, 'utf-8');
  }
  return { identity_file: file };
}

export function resolveWorkspaceXiaohongshuAuthorProfile({
  workspaceRoot,
  taskTitle = '',
  projectTitle = '',
  rawMaterials = '',
  promptFile = '',
  env = process.env,
}: {
  workspaceRoot: string;
  taskTitle?: string;
  projectTitle?: string;
  rawMaterials?: string;
  promptFile?: string;
  env?: Record<string, string | undefined>;
}) {
  const identity = readIdentity(workspaceRoot);
  const medical = isMedicalTopic([taskTitle, projectTitle, rawMaterials, promptFile].join('\n'));
  const routedProfileId = medical
    ? identity.routing?.medicalProfileId
    : identity.routing?.generalProfileId;
  const profileId = safeText(
    env.REDCUBE_AUTHOR_PROFILE_ID,
    safeText(routedProfileId, safeText(identity.defaultProfileId, DEFAULT_PROFILE_ID)),
  );
  const profile = identity.profiles?.[profileId] || {};
  const signatureDisplay = safeText(
    env.REDCUBE_SIGNATURE_DISPLAY,
    safeText(profile.signatureDisplay || profile.displayName, DEFAULT_SIGNATURE_DISPLAY),
  );

  return {
    profile_id: profileId,
    account_name: safeText(profile.displayName, signatureDisplay),
    signature_display: signatureDisplay,
    signature_subtitle: safeText(
      env.REDCUBE_SIGNATURE_SUBTITLE,
      safeText(profile.signatureSubtitle, DEFAULT_SIGNATURE_SUBTITLE),
    ),
    content_strategy: '',
    style_traits: '',
    narrative_focus: '',
    title_preference: '',
    taboo: '',
    origin: 'identity_fallback',
    config_scope: 'workspace',
    author_library_file: null,
    branding_rules: [
      '封面或结尾至少一处显式露出署名显示。',
      '署名副标适合做角标、页脚或收藏标签。',
      '发布文案与交付包需要保留同一套署名字段。',
    ],
  };
}
