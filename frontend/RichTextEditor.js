import React, {useEffect, useState} from 'react';

import {
	Box,
	Button,
	Heading,
	Loader,
	Switch,
	loadCSSFromString,
	loadScriptFromURLAsync,
	useRecordById,
} from '@airtable/blocks/ui';

import {ImagePicker} from './ImagePicker';
import {Editor} from '@tinymce/tinymce-react';
// import {sanitize} from './sanitize';
import showdown from 'showdown';

const LoadingSpinner = () => {
	// Set backgroundColor and zIndex so it overlaps tinymce until it's initialized.
	return (
		<Box
			backgroundColor='white'
			zIndex='2'
			position='fixed'
			display='flex'
			justifyContent='center'
			alignItems='center'
			height='calc(100vh - 24px)'
			width='100vw'
			top='0'
		>
		<Loader />
	</Box>
	)
}

// Load the tinymce script only after the editor is first called.
// If it's never called, there's no need to load it.
let editorScriptLoaded = false;

const EditorLoadingState = Object.freeze ({
	NotLoaded: 'NotLoaded',
	Loading: 'Loading',
	Loaded: 'Loaded',
	Initialized: 'Initialized'
});

export const RichTextEditor = ({table, recordId, isLocked, handleLockChanged}) => {
	if (!table || !recordId) {
		return (
			<Box
				display="flex"
				alignItems="center"
				justifyContent="center"
				fontSize="28px"
				height="100vh"
			>
				Pick a record :)
			</Box>
		)
	}

	let converter = new showdown.Converter({
		ghCodeBlocks: true,
		strikethrough: true,
		parseImgDimensions: true,
		tasklists: true,
	});
	let [markdown, setMarkdown] = useState();
	let [showImagePicker, setShowImagePicker] = useState(false);

	let intitialEditorLoadingState = EditorLoadingState.NotLoaded;
	if (editorScriptLoaded === true) {
		intitialEditorLoadingState = EditorLoadingState.Loaded;
	}

	const [editorLoadingState, setEditorLoadingState] = useState(intitialEditorLoadingState);
	const tinymce_url = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.2.0/tinymce.min.js';

	if (editorLoadingState === EditorLoadingState.NotLoaded) {
		setEditorLoadingState(EditorLoadingState.Loading);
		loadScriptFromURLAsync(tinymce_url).then(() => {
			editorScriptLoaded = true;
			setEditorLoadingState(EditorLoadingState.Loaded);
		});
	}

	const handleInit = () => {
		setEditorLoadingState(EditorLoadingState.Initialized);
		return;
  };

	const handleEditorChange = (content, editor) => {
		// let sanitizedHtml = sanitize(content);
		let markdown = converter.makeMarkdown(content);
		markdown = sanitizeMarkdown(markdown);
		setMarkdown(markdown);
		return;
	};

	const handleNoteSaved = () => {
		const editor = tinymce.get('note-editor');
		const content = editor.getContent();

		let markdown = converter.makeMarkdown(content);
		markdown = sanitizeMarkdown(markdown);

		handleNoteUpdated({
			'Notes': markdown,
		});
	}

	const sanitizeMarkdown = (markdown) => {
		if (!markdown) {
			return markdown;
		}

		let sanitized = markdown;

		let commentRegex = new RegExp('<!-- -->', 'g');
		sanitized = sanitized.replace(commentRegex, '');

		let trailingRegex = new RegExp('\s+$/', 'g');
		sanitized = sanitized.replace(trailingRegex, '');

		let imageRegex = new RegExp('\\]\\(', 'g');
		sanitized = sanitized.replace(imageRegex, '] (');

		sanitized = sanitized.replace(/\[\ \]/g, '- [ ]');
		sanitized = sanitized.replace(/\[\x\]/g, '- [x]');
		sanitized = sanitized.replace(/\n\[\ \]/g, '\n- [ ]');
		sanitized = sanitized.replace(/\n\[\x\]/g, '\n- [x]');

		return sanitized;
	}

	const handleNoteUpdated = debounce((updates) => {
		table.updateRecordAsync(recordId, updates);
	}, 500);

	// Debounce saving page updates to Airtable prevent the cursor from jumping to the top
	// https://davidwalsh.name/javascript-debounce-function
	// https://gist.github.com/nmsdvid/8807205#gistcomment-2318343
	function debounce(callback, time) {
	  let interval;
	  return (...args) => {
	    clearTimeout(interval);
	    interval = setTimeout(() => {
	      interval = null;
	      callback(...args);
	    }, time);
	  };
	}

	let record = useRecordById(table, recordId);
	let notes = record.getCellValue('Notes');
	if (!notes) {
		notes = 'Add some notes :)'
	}

	notes = sanitizeMarkdown(notes);
	
	let html = converter.makeHtml(notes);

	const toolbar = 'read | undo redo | removeformat | h1 h2 h3 | bold italic underline | customImageButton link blockquote | bullist numlist | codesample | fullscreen print help';
	const plugins = 'advlist anchor autolink codesample emoticons fullscreen help link lists paste print quickbars searchreplace table textpattern visualblocks';

	const setup = (editor) => {
		editor.ui.registry.addButton('customImageButton', {
      icon: 'image',
      tooltip: 'Add Image',
      onAction: () => {
        setShowImagePicker(true);
      }
    });
	};

	const init = {
    plugins: plugins,
    toolbar: toolbar,
    menubar: false,
    inline: false,
    quickbars_insert_toolbar: false,
    quickbars_selection_toolbar: false,
    // quickbars_selection_toolbar: 'bullist numlist | h1 h2 h3',
    statusbar: false,
    branding: false,
    default_link_target: '_blank',
    target_list: true,
		valid_elements: '*[*]',
		entity_encoding: 'raw',
		setup: setup,
	};

	if (!editorScriptLoaded) {
		return <LoadingSpinner />;
	}

	const css = `
	.mce-edit-focus,
	.page-title-input:focus {
		outline: none;
	}
	.mce-content-body,
	.mce-edit-focus {
		font-size: 14px;
		overflow: scroll;
		max-height: calc(100vh - 130px);
	}
	.tox-tinymce {
		flex: 1 1 auto;
	}
	`
	loadCSSFromString(css);

	const handleImageConfirmed = (selectedImage) => {
		setShowImagePicker(false);
		
		const idAndUrl = selectedImage.split(' ');
		const url = record.getAttachmentClientUrlFromCellValueUrl(
			idAndUrl[0],
			idAndUrl[1]
		);
		const img = `<img src="${url}" width="900">`;
		const editor = tinymce.get('note-editor');
		const newContent = editor.getContent() + img;
		editor.setContent(newContent);
	};

	const handleImageCanceled = () => {
		setShowImagePicker(false);
	}

	return (
		<Box
			as='main'
			style={{
				height: '100vh',
				padding: '10px',
				display: 'flex',
				flexFlow: 'column',
			}}
		>
			<Button
				icon="checkboxChecked"
				onClick={handleNoteSaved}
			>
				Save
			</Button>

			<Switch
	      value={isLocked || false}
	      onChange={value => handleLockChanged(value)}
	      label="Lock editor"
	      margin="10px 0"
	    />

	    {
	    	showImagePicker &&
	    	<ImagePicker
	    		record={record}
	    		handleImageConfirmed={handleImageConfirmed}
	    		handleImageCanceled={handleImageCanceled}
	    	/>
	    }

			{/*
				When using Tiny MCE as a controlled component, use onEditorChange.
				This stops the cursor from going to the top of the editor when you hit Enter.
				https://www.tiny.cloud/docs/integrations/react/#usingthetinymcereactcomponentasacontrolledcomponent
			*/}
			<Editor
				id="note-editor"
				value={html}
				init={init}
				onInit={handleInit}
				onEditorChange={handleEditorChange}
			/>
		</Box>
	)
}
