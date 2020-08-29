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
		const [activeTableId, setActiveTableId] = useState();
    const [selectedRecordId, setSelectedRecordId] = useState();
    const [editorIsLocked, setEditorIsLocked] = useState(false);

    const onRecordSelected = () => {
			let tableId = cursor.activeTableId;
			let recordId = cursor.selectedRecordIds[0];

			if (editorIsLocked) {
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

		if (cursor.selectedRecordIds.length > 0 && !selectedRecordId) {
			setSelectedRecordId(cursor.selectedRecordIds[0]);
		}

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
