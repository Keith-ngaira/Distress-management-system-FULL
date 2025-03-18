import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { distressMessages } from '../../services/api';
import DistressMessageForm from '../../components/DistressMessages/DistressMessageForm';

const EditDistressMessage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        subject: '',
        sender_name: '',
        country_of_origin: '',
        distressed_person_name: '',
        nature_of_case: '',
        case_details: '',
    });

    useEffect(() => {
        fetchMessage();
    }, [id]);

    const fetchMessage = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const message = await distressMessages.getById(parseInt(id, 10));
            setFormData({
                subject: message.subject,
                sender_name: message.sender_name,
                country_of_origin: message.country_of_origin,
                distressed_person_name: message.distressed_person_name,
                nature_of_case: message.nature_of_case,
                case_details: message.case_details,
            });
        } catch (error) {
            console.error('Error fetching message:', error);
            setError('Failed to load message details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!id) return;

        try {
            setSaving(true);
            await distressMessages.update(parseInt(id, 10), formData);
            navigate(`/messages/${id}`);
        } catch (error) {
            console.error('Error updating message:', error);
            setError('Failed to update message');
            setSaving(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <DistressMessageForm
            title="Edit Distress Message"
            formData={formData}
            onSubmit={handleSubmit}
            onChange={handleInputChange}
            onCancel={() => navigate(`/messages/${id}`)}
            error={error}
            loading={loading}
            saving={saving}
            submitButtonText="Save Changes"
        />
    );
};

export default EditDistressMessage;
