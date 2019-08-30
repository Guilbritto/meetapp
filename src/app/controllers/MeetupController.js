import * as Yup from 'yup';
import { isBefore, parseISO } from 'date-fns';
import Meetup from '../models/Meetup';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      schedule: Yup.date().required(),
    });

    if (!schema.isValid()) {
      return res.status(400).json({ error: 'Validation Fails' });
    }
    /**
     * Check if the date is before then now
     */
    if (isBefore(parseISO(req.body.schedule), new Date())) {
      res.status(400).json({ error: "Can't create meetups with past dates" });
    }
    /**
     * Check if banner is sent
     */
    if (!req.body.banner_id) {
      return res.status(400).json({ error: 'Banner must be sent!' });
    }
    const meetup = await Meetup.create({
      ...req.body,
      user_id: req.userId,
    });
    return res.json(meetup);
  }

  async update(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup Not found!' });
    }
    /**
     * check if the user is owner of the meetup
     */
    if (req.userId !== meetup.user_id) {
      return res
        .status(400)
        .json({ error: 'You can updates your own meetups!' });
    }
    /**
     * Check if the meetup has been happened
     */
    if (isBefore(meetup.schedule, new Date())) {
      return res
        .status(400)
        .json({ error: 'Only future meetups can be changed!' });
    }

    await meetup.update(req.body);

    return res.send(meetup);
  }

  async show(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
    });
    return res.json(meetups);
  }

  async delete(req, res) {
    const { id } = req.params;

    const meetup = await Meetup.findByPk(id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup Not found!' });
    }
    /**
     * check if the user is owner of the meetup
     */
    if (req.userId !== meetup.user_id) {
      return res
        .status(400)
        .json({ error: 'You can delete your own meetups!' });
    }
    await meetup.destroy();

    return res.json();
  }
}

export default new MeetupController();
