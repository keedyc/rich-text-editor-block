import React, {useState} from 'react';

import {
	ConfirmationDialog,
	Select
} from '@airtable/blocks/ui';

export const ImagePicker = ({
	record,
	handleImageConfirmed,
	handleImageCanceled,
}) => {
	const filesValue = record.getCellValue('Files') || [];

	const sortImages = (a, b) => {
		const nameA = a.filename.toUpperCase();
		const nameB = b.filename.toUpperCase();

		let comparison = 0;
		if (nameA > nameB) {
			comparison = 1
		} else if (nameA < nameB) {
			comparison = -1
		}
		return comparison
	}

	const mapImages = fileObj => ({
		value: `${fileObj.id} ${fileObj.url}`,
		label: fileObj.filename,
	})

	const images = filesValue
		.sort(sortImages)
		.map(mapImages);

	const initialImage = images.length > 0 ? images[0].value : null;
	const [selectedImage, setSelectedImage] = useState(initialImage);

	return (
		<ConfirmationDialog
  		title="Choose an image"
  		body={
  			<React.Fragment>
  				<Select
  					options={images}
  					value={selectedImage}
  					onChange={(newImage) => setSelectedImage(newImage)}
  				/>
  			</React.Fragment>
  		}
  		onConfirm={() => handleImageConfirmed(selectedImage)}
  		onCancel={handleImageCanceled}
  	/>
	)
}
