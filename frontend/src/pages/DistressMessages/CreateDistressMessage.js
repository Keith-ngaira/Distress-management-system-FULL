import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { distressMessages } from '../../services/api';
import DistressMessageForm from '../../components/DistressMessages/DistressMessageForm';

const CreateDistressMessage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        subject: '',
        sender_name: '',
        country_of_origin: '',
        distressed_person_name: '',
        nature_of_case: '',
        case_details: '',
    });
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await distressMessages.create(formData);
            navigate('/messages');
        } catch (err) {
            console.error('Error creating message:', err);
            setError('Failed to create distress message');
            setSaving(false);
        }
    };

    return (
        <DistressMessageForm
            title="Create Distress Message"
            formData={formData}
            onSubmit={handleSubmit}
            onChange={handleInputChange}
            onCancel={() => navigate('/messages')}
            error={error}
            saving={saving}
            submitButtonText="Create Message"
        />
    );
};

export default CreateDistressMessage;
