
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const MediaUpload = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'photo',
    file: null
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (formData.type === 'photo' && file.type !== 'image/webp') {
      toast.error('Format invalide — seul le WebP est accepté pour les photos');
      e.target.value = '';
      return;
    }
    setFormData(prev => ({ ...prev, file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.file || !formData.title) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    setUploading(true);
    try {
      await onUpload(formData);
      toast('Média téléchargé avec succès');
      setFormData({ title: '', description: '', type: 'photo', file: null });
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Télécharger un média</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titre du média"
              className="bg-background text-foreground"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description du média"
              className="bg-background text-foreground"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="bg-background text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">Photo</SelectItem>
                <SelectItem value="video">Vidéo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file">Fichier *</Label>
            <div className="mt-2">
              <label 
                htmlFor="file" 
                className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-all duration-200 bg-muted/50"
              >
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formData.file ? formData.file.name : 'Cliquez pour sélectionner un fichier'}
                </span>
              </label>
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept={formData.type === 'photo' ? 'image/webp' : 'video/*'}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Téléchargement...' : 'Télécharger'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MediaUpload;
