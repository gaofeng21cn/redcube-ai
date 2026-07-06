import type {
  PptRuntimeArtifactBase,
  PptRuntimeReviewStatePatch,
  PptReviewCapture,
} from '../types.js';

export interface PptExportBundleArtifact extends PptRuntimeArtifactBase {
  route: 'export_pptx';
  status: 'completed';
  review_state_patch: PptRuntimeReviewStatePatch;
  export_bundle: {
    source_visual_route?: 'author_pptx_native' | 'repair_pptx_native';
    source_html: string | null;
    source_pptx?: string;
    native_ppt_shape_manifest?: string;
    native_ppt_repair_log?: string;
    source_artifacts?: {
      pptx_file: string;
      pdf_file: string;
      shape_manifest_file: string;
      repair_log_file: string;
      preview_png_files: string[];
    };
    evidence_hashes?: {
      source_pptx_sha256: string | null;
      source_pdf_sha256: string | null;
      shape_manifest_sha256: string | null;
      repair_log_sha256: string | null;
      final_pptx_sha256: string | null;
      final_pdf_sha256: string | null;
      preview_png_sha256: Array<{
        file: string;
        sha256: string | null;
      }>;
    };
    renderer_proof?: {
      source_surface_kind?: 'native_pptx';
      renderer_kind?: 'libreoffice_headless';
      renderer_pipeline?: 'libreoffice_headless_pdf_png_v1';
      runtime?: 'libreoffice_headless';
      libreoffice_version?: string;
      poppler_version?: string;
      synthetic_preview?: false;
      required?: true;
      preview_screenshots?: string[];
    };
    shape_manifest_summary?: {
      schema_version: number;
      slide_count: number;
      native_quality_model: string | null;
      libreoffice_headless_pdf_png_v1: boolean;
      all_preview_hashes_present: boolean;
    };
    operator_proof_summary?: {
      proof_surface: 'native_export_bundle_operator_proof_summary_v1';
      status: 'output_ready';
      source_visual_route?: 'author_pptx_native' | 'repair_pptx_native';
      renderer_pipeline?: 'libreoffice_headless_pdf_png_v1';
      libreoffice_headless_pdf_png_v1: boolean;
      artifact_hashes?: PptExportBundleArtifact['export_bundle']['evidence_hashes'];
      source_artifact_refs?: PptExportBundleArtifact['export_bundle']['source_artifacts'];
      final_artifact_refs?: {
        pptx_file: string;
        pdf_file: string;
        presenter_notes_file: string;
        final_delivery_pptx_file: string;
        final_delivery_pdf_file: string;
      };
      shape_manifest_file?: string;
      repair_log_file?: string;
    };
    pptx_file: string;
    pdf_file: string;
    presenter_notes_file: string;
    final_delivery?: {
      current_dir: string;
      pptx_file: string;
      pdf_file: string;
      manifest_file: string;
      readme_file: string;
    };
    review_capture?: PptReviewCapture | null;
    delivery_state: {
      current: 'output_ready';
      next: null;
    };
    page_count: number;
    page_count_match: boolean;
    real_conversion_invocation: {
      tool: string;
      helper_id: string;
      package_module: string;
      command: string[];
    };
  };
  artifact_refs: string[];
}
