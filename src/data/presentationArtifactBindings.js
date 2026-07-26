import presentationManifest from '../../data/demo-projects/huanlegu-community-park/presentation_manifest_v1.json' with { type: 'json' };

export const HUANLEGU_PRESENTATION_BINDING_ID = presentationManifest.bindingId;

export const PRESENTATION_ARTIFACT_BINDINGS = {
  [HUANLEGU_PRESENTATION_BINDING_ID]: presentationManifest,
};

export function getPresentationArtifactBinding(bindingId) {
  return bindingId ? PRESENTATION_ARTIFACT_BINDINGS[bindingId] || null : null;
}
