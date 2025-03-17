import * as LibFlac from './dist/index.js';

interface FlacVariant {
	/**
	 * indicates which variant of the library instance:
	 * <pre>["release" | "dev" | "min"] + "." + ["asmjs" | "wasm"]</pre>
	 * for example
	 * <pre>"release.wasm"</pre>
	 *
	 * NOTE this property is only available when the library instance was
	 *      created by the (Node.js) factory method
	 */
	variant?: string;
}

export type Flac = typeof LibFlac & FlacVariant;

export {
	CreatedEvent, DestroyedEvent, CoderChangedEventData, ReadyEvent,
	BlockMetadata, Metadata, ReadResult, CompletedReadResult,  StreamMetadata, CodingOptions,
	decoder_error_callback_fn, decoder_read_callback_fn, decoder_write_callback_fn,
	encoder_write_callback_fn, metadata_callback_fn,
	FLAC__StreamDecoderErrorStatus, FLAC__StreamDecoderInitStatus, FLAC__StreamDecoderState,
	FLAC__StreamEncoderInitStatus, FLAC__StreamEncoderState, CompressionLevel,
	SubFrameMetadata, SubFramePartition, SubFramePartitionContent, SubFramePartitionData, FixedSubFrameData,
	FLAC__SubframeType, FLAC__ChannelAssignment, FLAC__EntropyCodingMethodType, LPCSubFrameData
} from './dist/index.js'
