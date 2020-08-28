import React, {useState, Fragment} from 'react';

import {cursor} from '@airtable/blocks';
import {
	initializeBlock,
	useBase,
	useLoadable,
	useRecordById,
	useWatchable
} from '@airtable/blocks/ui';

import {RichTextEditor} from './RichTextEditor';
import showdown from 'showdown';

const RichTextEditorBlock = () => {
    // Get the selected record.
    // Get the (Markdown) value of that record's "Notes" field.
    // Convert the Markdown into HTML.
    // Render the HTML

		const [activeTableId, setActiveTableId] = useState();
    const [selectedRecordId, setSelectedRecordId] = useState();
    const [editorIsLocked, setEditorIsLocked] = useState(false);

    const onRecordSelected = () => {
			let tableId = cursor.activeTableId;
			let recordId = cursor.selectedRecordIds[0];

			if (editorIsLocked || !recordId) {
				return;
			}

			setActiveTableId(tableId);
			setSelectedRecordId(recordId);
		}

		const onLockChanged = (newValue) => {
			setEditorIsLocked(newValue);
		}

    useLoadable(cursor);
    useWatchable(cursor, ['activeTableId', 'selectedRecordIds'], onRecordSelected);

		let base = useBase();
		let table = base.getTableById(cursor.activeTableId);

    return (
    	<Fragment>
	    	<RichTextEditor
	    		table={table}
	    		recordId={selectedRecordId}
	    		isLocked={editorIsLocked}
	    		handleLockChanged={onLockChanged}
	    	/>
	    </Fragment>
    );
}

initializeBlock(() => <RichTextEditorBlock />);
