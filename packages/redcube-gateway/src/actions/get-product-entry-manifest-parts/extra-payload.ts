// @ts-nocheck
import { buildRuntimeLoopClosureManifestSurface } from '../product-entry-continuity-surfaces.js';
import {
  FEDERATED_PRODUCT_ENTRY_CONTRACT_REF,
  MANAGED_PRODUCT_ENTRY_CONTRACT_REF,
  MANAGED_RUNTIME_OWNER,
  PRODUCT_ENTRY_CONTRACT_REF,
} from './policy.js';

export function buildManifestExtraPayload({
  deliverableFacade,
  nativePptOperatorUx,
  productEntrySessionCommand,
  routeEquivalence,
}) {
  return {
    ok: true,
    recommended_action: 'invoke_product_entry',
    route_equivalence: routeEquivalence,
    deliverable_facade: deliverableFacade,
    native_ppt_operator_ux: nativePptOperatorUx,
    review_state: { surface_kind: 'review_state', owner: 'redcube_ai', status: 'runtime_projection_ref', summary: 'Manifest-level read-only ref for RCA review state; runtime truth is produced by product-entry/session execution.', runtime_truth_surface: 'getReviewState', session_command_template: productEntrySessionCommand, route_rule: 'must_use_redcube_product_entry_and_review_export_gates' },
    publication_projection: { surface_kind: 'publication_projection', owner: 'redcube_ai', status: 'runtime_projection_ref', summary: 'Manifest-level read-only ref for RCA publication projection; runtime truth is produced by product-entry/session execution.', runtime_truth_surface: 'getPublicationProjection', session_command_template: productEntrySessionCommand, route_rule: 'must_use_redcube_product_entry_and_review_export_gates' },
    current_truth: { product_entry_contract: PRODUCT_ENTRY_CONTRACT_REF, federated_product_entry_contract: FEDERATED_PRODUCT_ENTRY_CONTRACT_REF, managed_product_entry_contract: MANAGED_PRODUCT_ENTRY_CONTRACT_REF },
    session_continuity: {
      surface_kind: 'session_continuity',
      owner: 'redcube_ai',
      status: 'repo_tracked',
      summary: 'RCA product-entry session continuity is persisted in the shared session store and restored via entry_session_id.',
      progress_surface_ref: {
        ref_kind: 'json_pointer',
        ref: '/progress_projection',
        label: 'progress projection surface',
      },
      artifact_surface_ref: {
        ref_kind: 'json_pointer',
        ref: '/artifact_inventory',
        label: 'artifact inventory surface',
      },
      restore_point_surface_ref: {
        ref_kind: 'json_pointer',
        ref: '/session_continuity/restore_point',
        label: 'restore point surface',
      },
      restore_point_field_refs: [
        { ref_kind: 'json_pointer', ref: '/continuation_snapshot/latest_managed_run_id', label: 'latest managed run id' },
        { ref_kind: 'json_pointer', ref: '/continuation_snapshot/latest_run_id', label: 'latest route run id' },
        { ref_kind: 'json_pointer', ref: '/session_continuity/restore_point/latest_handle', label: 'latest handle' },
      ],
      session_surface_ref: {
        ref_kind: 'json_pointer',
        ref: '/entry_session',
        label: 'entry session surface',
      },
      session_file_ref: {
        ref_kind: 'json_pointer',
        ref: '/entry_session/session_file',
        label: 'entry session file path',
      },
      session_command_template: productEntrySessionCommand,
      truth_surfaces: [
        {
          surface_kind: 'product_entry',
          ref_kind: 'json_pointer',
          ref: '/session_continuity',
          label: 'direct product entry continuity surface',
        },
        {
          surface_kind: 'product_entry_session',
          ref_kind: 'json_pointer',
          ref: '/session_continuity',
          label: 'session inspection continuity surface',
        },
      ],
    },
    progress_projection: {
      surface_kind: 'progress_projection',
      owner: 'redcube_ai',
      status: 'repo_tracked',
      summary: 'Managed progress projection is surfaced alongside session continuity and can be dereferenced from the same-session restore point.',
      projection_field_ref: {
        ref_kind: 'json_pointer',
        ref: '/progress_projection/projection',
        label: 'progress projection payload',
      },
      runtime_refs_ref: {
        ref_kind: 'json_pointer',
        ref: '/progress_projection/refs',
        label: 'runtime supervision refs',
      },
      fallback_projection_ref: {
        ref_kind: 'json_pointer',
        ref: '/continuation_snapshot/managed_progress_projection',
        label: 'managed progress projection snapshot',
      },
      fallback_runtime_refs_ref: {
        ref_kind: 'json_pointer',
        ref: '/continuation_snapshot/runtime_supervision/refs',
        label: 'runtime supervision refs snapshot',
      },
      truth_surfaces: [
        {
          surface_kind: 'product_entry',
          ref_kind: 'json_pointer',
          ref: '/progress_projection',
          label: 'direct product entry progress surface',
        },
        {
          surface_kind: 'product_entry_session',
          ref_kind: 'json_pointer',
          ref: '/progress_projection',
          label: 'session inspection progress surface',
        },
      ],
    },
    artifact_inventory: {
      surface_kind: 'artifact_inventory',
      owner: 'redcube_ai',
      status: 'repo_tracked',
      summary: 'Artifact inventory surfaces the final artifact refs for the same-session restore point.',
      artifact_refs_ref: {
        ref_kind: 'json_pointer',
        ref: '/artifact_inventory/artifact_refs',
        label: 'artifact refs list',
      },
      artifact_ref_count_ref: {
        ref_kind: 'json_pointer',
        ref: '/artifact_inventory/summary/artifact_ref_count',
        label: 'artifact ref count',
      },
      restore_point_ref: {
        ref_kind: 'json_pointer',
        ref: '/artifact_inventory/restore_point',
        label: 'artifact restore point',
      },
      artifact_refs_fallback_ref: {
        ref_kind: 'json_pointer',
        ref: '/continuation_snapshot/managed_progress_projection/final_artifact_refs',
        label: 'managed run final artifact refs',
      },
      restore_point_field_refs: [
        { ref_kind: 'json_pointer', ref: '/continuation_snapshot/latest_managed_run_id', label: 'latest managed run id' },
        { ref_kind: 'json_pointer', ref: '/continuation_snapshot/latest_run_id', label: 'latest route run id' },
        { ref_kind: 'json_pointer', ref: '/artifact_inventory/restore_point/latest_handle', label: 'latest handle' },
      ],
      session_command_template: productEntrySessionCommand,
      truth_surfaces: [
        {
          surface_kind: 'product_entry',
          ref_kind: 'json_pointer',
          ref: '/artifact_inventory',
          label: 'direct product entry artifact surface',
        },
        {
          surface_kind: 'product_entry_session',
          ref_kind: 'json_pointer',
          ref: '/artifact_inventory',
          label: 'session inspection artifact surface',
        },
      ],
    },
    runtime_loop_closure: buildRuntimeLoopClosureManifestSurface({
      runtimeOwner: MANAGED_RUNTIME_OWNER,
    }),
    continuity_descriptor: {
      session_continuity: {
        surface_kind: 'session_continuity',
        truth_surfaces: [
          { surface_kind: 'product_entry', ref_kind: 'json_pointer', ref: '/session_continuity' },
          { surface_kind: 'product_entry_session', ref_kind: 'json_pointer', ref: '/session_continuity' },
        ],
        session_command_template: productEntrySessionCommand,
        session_file_ref: { ref_kind: 'json_pointer', ref: '/entry_session/session_file' },
        restore_point_refs: [
          { ref_kind: 'json_pointer', ref: '/continuation_snapshot/latest_managed_run_id' },
          { ref_kind: 'json_pointer', ref: '/continuation_snapshot/latest_run_id' },
          { ref_kind: 'json_pointer', ref: '/session_continuity/restore_point/latest_handle' },
        ],
      },
      progress_projection: {
        surface_kind: 'progress_projection',
        truth_surfaces: [
          { surface_kind: 'product_entry', ref_kind: 'json_pointer', ref: '/progress_projection' },
          { surface_kind: 'product_entry_session', ref_kind: 'json_pointer', ref: '/progress_projection' },
        ],
        projection_ref: { ref_kind: 'json_pointer', ref: '/continuation_snapshot/managed_progress_projection' },
        runtime_refs_ref: { ref_kind: 'json_pointer', ref: '/continuation_snapshot/runtime_supervision/refs' },
      },
      artifact_inventory: {
        surface_kind: 'artifact_inventory',
        truth_surfaces: [
          { surface_kind: 'product_entry', ref_kind: 'json_pointer', ref: '/artifact_inventory' },
          { surface_kind: 'product_entry_session', ref_kind: 'json_pointer', ref: '/artifact_inventory' },
        ],
        session_command_template: productEntrySessionCommand,
        restore_point_refs: [
          { ref_kind: 'json_pointer', ref: '/continuation_snapshot/latest_managed_run_id' },
          { ref_kind: 'json_pointer', ref: '/continuation_snapshot/latest_run_id' },
          { ref_kind: 'json_pointer', ref: '/artifact_inventory/restore_point/latest_handle' },
        ],
        artifact_ref_refs: [
          { ref_kind: 'json_pointer', ref: '/continuation_snapshot/managed_progress_projection/final_artifact_refs' },
          { ref_kind: 'json_pointer', ref: '/artifact_inventory/artifact_refs' },
        ],
      },
    },
  };
}
